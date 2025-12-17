import { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import { useNavigate } from 'react-router-dom';

export function ImportPage() {
    const { actions } = useDriver();
    const [textData, setTextData] = useState('');
    const [status, setStatus] = useState('idle'); // idle, processing, done
    const [log, setLog] = useState([]);
    const navigate = useNavigate();

    const handleImport = async () => {
        setStatus('processing');
        const lines = textData.trim().split('\n');
        const newLog = [];
        let successCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Detect separator: Tab (from Excel copy) or Comma (CSV)
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');

            if (parts.length < 4) {
                newLog.push(`❌ Línea ${i + 1}: Formato incorrecto (faltan columnas)`);
                continue;
            }

            const [rawDate, rawPlatform, rawHours, rawEarnings] = parts;

            try {
                // Clean data
                const date = rawDate.trim();
                const platform = rawPlatform.trim();
                // Replace commas with dots for decimals in hours if needed
                const hours = parseFloat(rawHours.replace(',', '.').trim());
                // Remove non-numeric chars from earnings
                const earnings = parseFloat(rawEarnings.replace(/[^0-9]/g, ''));

                if (isNaN(hours) || isNaN(earnings)) {
                    throw new Error("Números inválidos");
                }

                await actions.addShift({
                    date,
                    platform,
                    hours,
                    earnings
                });

                successCount++;
                newLog.push(`✅ Línea ${i + 1}: Importada (${date} - ${platform})`);

            } catch (e) {
                newLog.push(`❌ Línea ${i + 1}: Error - ${e.message}`);
            }
        }

        setLog(newLog);
        setStatus('done');
        alert(`Proceso finalizado. ${successCount} registros importados.`);
    };

    return (
        <div className="fade-in" style={{ padding: '1rem' }}>
            <div className="card">
                <h2>📥 Importación Masiva</h2>
                <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                    Copia tus celdas de Excel (Fecha | Plataforma | Horas | Ganancia) y pégalas aquí abajo.
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
                        fontFamily: 'monospace'
                    }}
                    placeholder={`2024-12-01	Uber	5.5	40000\n2024-12-02	Didi	4	30000`}
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
                            <div key={i} style={{ color: entry.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                {entry}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
