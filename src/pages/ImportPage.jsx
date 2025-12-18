import { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import { useNavigate } from 'react-router-dom';

export function ImportPage() {
    const { actions } = useDriver();
    const [textData, setTextData] = useState('');
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [log, setLog] = useState([]);
    const navigate = useNavigate();

    const parseCurrency = (val) => {
        if (!val) return 0;
        const clean = val.toString().trim().replace(/[^0-9,.-]/g, '');
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
        let parts;
        // Handle "YYYY-MM-DD" or "DD/MM/YYYY"
        if (val.includes('-')) {
            return val.trim();
        } else {
            parts = val.trim().split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
        }
        return null;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            setTextData(evt.target.result);
        };
        reader.readAsText(file);
    };

    const processData = async () => {
        setStatus('processing');
        const lines = textData.trim().split(/\r\n|\n/); // Handle Windows/Unix line endings
        const newLog = [];
        let successCount = 0;

        let shiftsToSave = [];

        // 1. First Pass: Parse all lines into objects
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (line.toLowerCase().includes('fecha')) continue;

            const separator = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
            const parts = line.split(separator);

            if (parts.length < 1) continue;

            const dateStr = parts[0];
            const date = parseDate(dateStr);
            if (!date) {
                newLog.push(`⚠️ Línea ${i + 1}: Fecha inválida (${dateStr}) - Ignorada`);
                continue;
            }

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

            let maxEarner = platforms[0];
            for (let p of platforms) {
                if (p.amount > maxEarner.amount) maxEarner = p;
            }

            for (const p of platforms) {
                const shiftHours = (p.name === maxEarner.name) ? totalHours : 0;
                shiftsToSave.push({
                    date,
                    platform: p.name,
                    hours: shiftHours,
                    earnings: p.amount,
                    line: i + 1
                });
            }
        }

        setProgress({ current: 0, total: shiftsToSave.length });

        // 2. Second Pass: Batch Upload (Parallel)
        const BATCH_SIZE = 10; // 10 parallel requests at a time
        for (let i = 0; i < shiftsToSave.length; i += BATCH_SIZE) {
            const batch = shiftsToSave.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (shift) => {
                try {
                    await actions.addShift({
                        date: shift.date,
                        platform: shift.platform,
                        hours: shift.hours,
                        earnings: shift.earnings
                    });
                    successCount++;
                } catch (e) {
                    newLog.push(`❌ Error guardando ${shift.date} ${shift.platform}: ${e.message}`);
                }
            });

            await Promise.all(promises);
            setProgress(prev => ({ ...prev, current: Math.min(prev.total, i + BATCH_SIZE) }));
        }

        newLog.push(`✅ Proceso finalizado. ${successCount} registros creados.`);
        setLog(newLog);
        setStatus('done');
        setProgress({ current: 0, total: 0 });
    };

    return (
        <div className="fade-in" style={{ padding: '1rem' }}>
            <div className="card">
                <h2>📥 Importación Histórica</h2>
                <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                    Sube tu archivo CSV o pega el contenido manual.
                </p>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
                    <strong>Formato: Fecha | Uber | Didi | Otros | Horas</strong>
                </div>

                {/* File Input */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        Opción 1: Subir Archivo CSV / Excel (Guardar como CSV)
                    </label>
                    <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        style={{ color: 'var(--text-primary)' }}
                    />
                </div>

                <textarea
                    style={{
                        width: '100%',
                        height: '150px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre'
                    }}
                    placeholder={`Opción 2: Pegar aquí...\n01/10/2024;45000;0;0;5.5`}
                    value={textData}
                    onChange={(e) => setTextData(e.target.value)}
                />

                {/* Progress Bar */}
                {status === 'processing' && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.9rem' }}>Procesando...</span>
                            <span style={{ fontSize: '0.9rem' }}>{progress.current} / {progress.total}</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                                height: '100%',
                                background: '#3b82f6',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={processData}
                        disabled={status === 'processing' || !textData}
                    >
                        {status === 'processing' ? 'Procesando...' : 'Iniciar Importación'}
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
