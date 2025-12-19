import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

export function ImportPage() {
    const { actions } = useDriver();
    const [status, setStatus] = useState({ loading: false, msg: '', type: '' });
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus({ loading: true, msg: 'Iniciando importación veloz...', type: 'info' });

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (!Array.isArray(data)) throw new Error("Formato inválido");

                const total = data.length;
                setProgress({ current: 0, total: total });

                // --- CONFIGURACIÓN DE VELOCIDAD ---
                const CHUNK_SIZE = 10; // Mandamos de a 10 viajes juntos
                let processed = 0;

                for (let i = 0; i < total; i += CHUNK_SIZE) {
                    // Seleccionamos el grupo (lote)
                    const chunk = data.slice(i, i + CHUNK_SIZE);

                    // Los mandamos todos juntos en paralelo
                    await Promise.all(chunk.map(shift => {
                        if (shift.date && shift.platform) {
                            return actions.addShift({
                                date: shift.date,
                                platform: shift.platform,
                                hours: parseFloat(shift.hours) || 0,
                                earnings: parseFloat(shift.earnings) || 0
                            });
                        }
                        return Promise.resolve();
                    }));

                    processed += chunk.length;
                    setProgress({ current: processed, total: total });
                }

                setStatus({
                    loading: false,
                    msg: `¡Listo! Se importaron ${total} registros en tiempo récord.`,
                    type: 'success'
                });

            } catch (err) {
                console.error(err);
                setStatus({
                    loading: false,
                    msg: 'Error: El archivo no es compatible.',
                    type: 'error'
                });
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="import-page fade-in" style={{ paddingBottom: '100px' }}>
            <div className="card">
                <h2>📥 Importación de Alta Velocidad</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Subí tu archivo <strong>.json</strong>. Ahora el sistema procesa los datos en paralelo para que no tengas que esperar.
                </p>

                <div style={{ textAlign: 'center', padding: '30px', border: '3px dashed var(--primary)', borderRadius: '16px', background: '#fff0f5' }}>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        disabled={status.loading}
                        id="file-upload"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block', padding: '15px 30px' }}>
                        {status.loading ? 'CARGANDO DATOS...' : 'SELECCIONAR ARCHIVO JSON'}
                    </label>
                </div>

                {status.loading && (
                    <div style={{ marginTop: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <span>Progreso de subida</span>
                            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: '16px' }}>
                            <div className="progress-bar-fill" style={{ width: `${(progress.current / progress.total) * 100}%`, borderRadius: '10px' }}></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '8px', color: 'var(--text-muted)' }}>
                            Procesados: {progress.current} de {progress.total} viajes.
                        </p>
                    </div>
                )}

                {status.msg && (
                    <div className="badge" style={{
                        marginTop: '20px',
                        display: 'block',
                        textAlign: 'center',
                        padding: '12px',
                        fontSize: '0.9rem',
                        backgroundColor: status.type === 'error' ? '#ffebee' : '#f0fdf4',
                        color: status.type === 'error' ? '#c62828' : '#166534',
                        border: '1px solid currentColor'
                    }}>
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}