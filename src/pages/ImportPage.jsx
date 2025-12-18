import { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import { useNavigate } from 'react-router-dom';

export function ImportPage() {
    const { actions } = useDriver();
    const [textData, setTextData] = useState('');
    const [status, setStatus] = useState('idle');
    const [log, setLog] = useState([]);
    const navigate = useNavigate();

    const parseCurrency = (val) => {
        if (!val) return 0;
        // Clean: Remove anything that isn't a number, comma, dot, or minus
        // Also remove 'new line' or 'tab' ghosts just in case
        const clean = val.toString().trim().replace(/[^0-9,.-]/g, '');

        // Handle common formats:
        // 1.000,00 (European/Latam) -> Remove dots, replace comma with dot.
        // 1,000.00 (US) -> Remove commas.
        // Heuristic: If there are dots and the last separator is a comma, assume dot is thousand.
        // Given user context (latam likely), we assume dot = thousand, comma = decimal.

        const numStr = clean.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(numStr);
        return isNaN(num) ? 0 : num;
    };

    const parseHours = (val) => {
        if (!val) return 0;
        const clean = val.toString().trim().replace(',', '.').replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    const parseDate = (val) => {
        if (!val) return null;
        const parts = val.trim().split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        if (val.includes('-')) return val;
        return null;
    };

    const handleImport = async () => {
        if (!window.confirm('¿Confirmas que los datos copiados siguen el orden: Fecha | Uber | Didi | Otros | Horas?')) return;

        setStatus('processing');
        const lines = textData.trim().split('\n');
        const newLog = [];
        let successCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Skip headers
            if (line.toLowerCase().includes('fecha')) continue;

            const parts = line.split('\t');

            // Need at least date
            if (parts.length < 1) continue;

            const dateStr = parts[0];
            const date = parseDate(dateStr);
            if (!date) {
                newLog.push(`⚠️ Línea ${i + 1}: Fecha inválida (${dateStr}) - Ignorada`);
                continue;
            }

            // Columns indices: 0=Date, 1=Uber, 2=Didi, 3=Other, 4=Hours
            // Use safe access in case columns are missing (undefined becomes 0)
            const uber = parseCurrency(parts[1] || '0');
            const didi = parseCurrency(parts[2] || '0');
            const other = parseCurrency(parts[3] || '0');
            const totalHours = parseHours(parts[4] || '0');

            const platforms = [
                { name: 'Uber', amount: uber },
                { name: 'Didi', amount: didi },
                { name: 'Otros', amount: other }
            ].filter(p => p.amount > 0);

            if (platforms.length === 0) continue;

            // Find max earner to assign hours
            let maxEarner = platforms[0];
            for (let p of platforms) {
                if (p.amount > maxEarner.amount) maxEarner = p;
            }

            for (const p of platforms) {
                try {
                    // Only assign hours if it's the max earner
                    const shiftHours = (p.name === maxEarner.name) ? totalHours : 0;

                    await actions.addShift({
                        date,
                        platform: p.name,
                        hours: shiftHours,
                        earnings: p.amount
                    });
                    successCount++;
                } catch (e) {
                    newLog.push(`❌ Error guardando ${date} ${p.name}: ${e.message}`);
                }
            }
        }

        newLog.push(`✅ Proceso finalizado. ${successCount} registros creados.`);
        setLog(newLog);
        setStatus('done');
    };

    return (
        <div className="fade-in" style={{ padding: '1rem' }}>
            <div className="card">
                <h2>📥 Importación Histórica desde Excel</h2>
                <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                    Copia tus celdas de Excel <strong>EXACTAMENTE</strong> en este orden:
                </p>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
                    <strong>Fecha | Uber | Didi | Otros | Horas</strong>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    * Las horas del día se asignarán a la plataforma con mayor ganancia para evitar duplicarlas.<br />
                    * Copia y pega desde tu Google Sheets (incluyendo las filas con $0).
                </p>

                <textarea
                    style={{
                        width: '100%',
                        height: '200px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre'
                    }}
                    placeholder={`01/10/2024	45.000	0	0	5,5
02/10/2024	20.000	15.000	0	6`}
                    value={textData}
                    onChange={(e) => setTextData(e.target.value)}
                />

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={handleImport}
                        disabled={status === 'processing' || !textData}
                    >
                        {status === 'processing' ? 'Procesando...' : 'Importar Datos'}
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/')}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                    >
                        Volver
                    </button>
                </div>

                {log.length > 0 && (
                    <div style={{ marginTop: '2rem', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                        {log.map((entry, i) => (
                            <div key={i} style={{ color: entry.includes('❌') ? '#f87171' : (entry.includes('⚠️') ? '#fbbf24' : '#4ade80'), marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                {entry}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
