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
                if (!Array.isArray(data)) throw new Error("Formato inválido: Se espera una lista de viajes.");

                const total = data.length;
                setProgress({ current: 0, total: total });

                // --- CONFIGURACIÓN DE VELOCIDAD ---
                const CHUNK_SIZE = 20; // Aumentamos el lote para mayor velocidad
                let processed = 0;
                let errorCount = 0;

                for (let i = 0; i < total; i += CHUNK_SIZE) {
                    const chunk = data.slice(i, i + CHUNK_SIZE);

                    await Promise.all(chunk.map(shift => {
                        // Validación más estricta
                        if (!shift.date || !shift.platform) return Promise.resolve();

                        const hours = parseFloat(shift.hours);
                        const earnings = parseFloat(shift.earnings);

                        // Ignoramos registros con datos numéricos corruptos
                        if (isNaN(hours) || isNaN(earnings)) {
                            errorCount++;
                            return Promise.resolve();
                        }

                        return actions.addShift({
                            date: shift.date,
                            platform: shift.platform,
                            hours: hours,
                            earnings: earnings
                        });
                    }));

                    processed += chunk.length;
                    setProgress({ current: processed, total: total });
                }

                setStatus({
                    loading: false,
                    msg: `¡Listo! Se procesaron ${total} registros. ${errorCount > 0 ? `(${errorCount} ignorados por error)` : ''}`,
                    type: 'success'
                });

            } catch (err) {
                console.error(err);
                setStatus({
                    loading: false,
                    msg: 'Error crítico: El archivo no es un JSON válido o está corrupto.',
                    type: 'error'
                });
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="pb-24 fade-in">
            <div className="card">
                <h2 className="text-xl font-bold mb-4">📥 Importación de Alta Velocidad</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Subí tu archivo <strong>.json</strong>. El sistema procesará los datos en paralelo e ignorará automáticamente los registros inválidos.
                </p>

                <div className="text-center p-8 border-3 border-dashed border-[var(--primary)] rounded-xl bg-pink-50">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        disabled={status.loading}
                        id="file-upload"
                        className="hidden"
                    />
                    <label
                        htmlFor="file-upload"
                        className={`btn-primary cursor-pointer inline-block px-8 py-4 ${status.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {status.loading ? 'CARGANDO DATOS...' : 'SELECCIONAR ARCHIVO JSON'}
                    </label>
                </div>

                {status.loading && (
                    <div className="mt-6">
                        <div className="flex justify-between mb-2 text-sm font-bold">
                            <span>Progreso de subida</span>
                            <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--primary)] transition-all duration-300 rounded-full"
                                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-center mt-2 text-gray-500">
                            Procesados: {progress.current} de {progress.total} viajes.
                        </p>
                    </div>
                )}

                {status.msg && (
                    <div className={`mt-5 text-center p-3 text-sm rounded border ${status.type === 'error'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}