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
        // Remove $, dots/commas if used as thousand separators, keep numbers
        // Assuming format $1.000 or 1000. 
        // Risky part: logic if ',' is decimal. In simple currency int usually no decimals or ignored.
        // Simple approach: strip everything non-numeric.
        const num = parseFloat(val.toString().replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    const parseDate = (val) => {
        // Expecting dd/mm/yyyy from Excel/Sheets copy
        if (!val) return null;
        const parts = val.split('/');
        if (parts.length === 3) {
            // Excel often copies as d/m/yyyy. Pad with 0.
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        // Access might copy as yyyy-mm-dd check
        if (val.includes('-')) return val;
        return null;
    };

    const handleImport = async () => {
        if (!window.confirm('¿Confirmas que los datos copiados siguen el orden: Fecha | Uber | Didi | Otros?')) return;

        setStatus('processing');
        const lines = textData.trim().split('\n');
        const newLog = [];
        let successCount = 0;

        // Batch configs
        const COLUMN_MAP = ['date', 'Uber', 'Didi', 'Otros'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Skip headers if detected
            if (line.toLowerCase().includes('fecha') || line.toLowerCase().includes('uber')) continue;

            const parts = line.split('\t'); // Excel copies with Tabs

            // Robustness: User might have hidden column B. If parts > 4, we might need warning or smart guess.
            // Assuming strict copy from user request: A, C, D, E -> 4 columns text.

            const dateStr = parts[0];
            const date = parseDate(dateStr);
            if (!date) {
                newLog.push(`⚠️ Línea ${i + 1}: Fecha inválida (${dateStr}) - Ignorada`);
                continue;
            }

            // Iterate platforms columns
            // Col 1: Uber, Col 2: Didi, Col 3: Otros
            for (let col = 1; col < 4; col++) {
                if (col >= parts.length) break;

                const rawAmount = parts[col];
                const earnings = parseCurrency(rawAmount);
                const platform = COLUMN_MAP[col];

                if (earnings > 0) {
                    try {
                        await actions.addShift({
                            date,
                            platform,
                            hours: 0, // No hours data in history
                            earnings
                        });
                        successCount++;
                        // Don't log every single one to avoid spam, maybe just summary or errors
                    } catch (e) {
                        newLog.push(`❌ Error guardando ${date} ${platform}: ${e.message}`);
                    }
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
                    Para que funcione, copia tus columnas de Excel <strong>EXACTAMENTE</strong> en este orden:
                </p>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
                    <strong>Fecha | Uber | Didi | Otros</strong>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    * Las horas se guardarán como 0 ya que no están en el registro histórico.<br />
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
                    placeholder={`23/10/2024	$45.000	$0	$0
24/10/2024	$20.000	$15.000	$5.000`}
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
