import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

export function ImportPage() {
    const { actions } = useDriver();
    const [status, setStatus] = useState({ loading: false, msg: '', type: '' });
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus({ loading: true, msg: 'Leyendo archivo...', type: 'info' });

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // Convertimos el texto del archivo en un objeto real de JS
                const data = JSON.parse(evt.target.result);

                if (!Array.isArray(data)) {
                    throw new Error("El formato del archivo no es una lista de viajes.");
                }

                setProgress({ current: 0, total: data.length });
                let successCount = 0;

                // Subida secuencial a Firebase
                for (let i = 0; i < data.length; i++) {
                    const shift = data[i];

                    // Validamos que el objeto tenga lo mínimo necesario
                    if (shift.date && shift.platform) {
                        await actions.addShift({
                            date: shift.date,
                            platform: shift.platform,
                            hours: parseFloat(shift.hours) || 0,
                            earnings: parseFloat(shift.earnings) || 0
                        });
                        successCount++;
                    }
                    setProgress(prev => ({ ...prev, current: i + 1 }));
                }

                setStatus({
                    loading: false,
                    msg: `¡Éxito! Se importaron ${successCount} registros correctamente.`,
                    type: 'success'
                });

            } catch (err) {
                console.error(err);
                setStatus({
                    loading: false,
                    msg: 'Error: El archivo JSON es inválido o tiene errores.',
                    type: 'error'
                });
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="import-page fade-in" style={{ paddingBottom: '100px' }}>
            <div className="card">
                <h2>📥 Importador Profesional (JSON)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Seleccioná el archivo <strong>.json</strong> con tu historial para sincronizarlo con Firebase.
                </p>

                <div className="file-input-container" style={{ textAlign: 'center', padding: '20px', border: '2px dashed #eee', borderRadius: '12px' }}>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        disabled={status.loading}
                        id="file-upload"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                        {status.loading ? 'PROCESANDO...' : 'SELECCIONAR ARCHIVO .JSON'}
                    </label>
                </div>

                {status.loading && (
                    <div style={{ marginTop: '20px' }}>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                        </div>
                        <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                            Subiendo: {progress.current} de {progress.total}
                        </p>
                    </div>
                )}

                {status.msg && (
                    <div className="badge" style={{
                        marginTop: '20px',
                        display: 'block',
                        textAlign: 'center',
                        backgroundColor: status.type === 'error' ? '#fff0f0' : '#f0fff4',
                        color: status.type === 'error' ? 'var(--primary)' : 'var(--xmas-green)'
                    }}>
                        {status.msg}
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '20px', background: '#e3f2fd', border: 'none' }}>
                <h4>💡 ¿Por qué JSON?</h4>
                <p style={{ fontSize: '0.85rem', color: '#1565c0' }}>
                    Al usar archivos JSON evitamos que el sistema se confunda con los puntos de mil o los espacios de las planillas. Es la forma más segura de no perder datos de tus ganancias.
                </p>
            </div>
        </div>
    );
}