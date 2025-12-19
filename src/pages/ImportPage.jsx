import { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import { useNavigate } from 'react-router-dom';

export function ImportPage() {
    const { actions } = useDriver();
    const [textData, setTextData] = useState(''); // Lo dejamos vacío para que pegues tus datos
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [log, setLog] = useState([]);
    const navigate = useNavigate();

    // Limpiador de números pro: maneja "55.762,00" y los convierte en 55762
    const parseCurrency = (val) => {
        if (!val || val === '0' || val === '0,00') return 0;
        const clean = val.toString().replace(/[^0-9,.-]/g, '');
        const noDots = clean.replace(/\./g, '');
        const standard = noDots.replace(/,/g, '.');
        const num = parseFloat(standard);
        return isNaN(num) ? 0 : num;
    };

    const parseDate = (val) => {
        if (!val) return null;
        const cleanVal = val.replace(/['"]/g, '').trim();
        if (cleanVal.includes('-')) return cleanVal;
        const parts = cleanVal.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        return null;
    };

    const processData = async () => {
        if (!textData) return;

        setStatus('processing');
        const lines = textData.trim().split(/\r\n|\n/);
        const shiftsToSave = [];
        const newLog = [];

        lines.forEach((line, index) => {
            const row = line.trim();
            if (!row || row.toLowerCase().startsWith('fecha')) return;

            // Separamos por tabulación o por 2 o más espacios seguidos
            const parts = row.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p !== "");

            if (parts.length < 2) return;

            const date = parseDate(parts[0]);
            if (!date) {
                newLog.push(`❌ Línea ${index + 1}: Fecha inválida (${parts[0]})`);
                return;
            }

            // --- LÓGICA INTELIGENTE DE COLUMNAS ---
            // El último elemento siempre son las HORAS
            const totalHours = parseFloat(parts[parts.length - 1].replace(',', '.')) || 0;

            // Las columnas del medio son las PLATAFORMAS (Uber, Didi, Otros...)
            const earningsRaw = parts.slice(1, parts.length - 1);

            let platforms = [];
            if (earningsRaw.length >= 1) platforms.push({ name: 'Uber', amount: parseCurrency(earningsRaw[0]) });
            if (earningsRaw.length >= 2) platforms.push({ name: 'Didi', amount: parseCurrency(earningsRaw[1]) });
            if (earningsRaw.length >= 3) platforms.push({ name: 'Otros', amount: parseCurrency(earningsRaw[2]) });

            const activePlatforms = platforms.filter(p => p.amount > 0);

            if (activePlatforms.length === 0 && totalHours > 0) {
                // Si trabajó horas pero no ganó (día malo), lo asignamos a Otros
                activePlatforms.push({ name: 'Otros', amount: 0 });
            }

            // Repartimos las horas: se las asignamos a la app donde más ganó
            let maxAmount = -1;
            let maxIndex = 0;
            activePlatforms.forEach((p, i) => {
                if (p.amount > maxAmount) {
                    maxAmount = p.amount;
                    maxIndex = i;
                }
            });

            activePlatforms.forEach((p, i) => {
                shiftsToSave.push({
                    date,
                    platform: p.name,
                    earnings: p.amount,
                    hours: i === maxIndex ? totalHours : 0, // Solo suma horas a la principal para no duplicar tiempo total
                    lineRef: index + 1
                });
            });
        });

        setProgress({ current: 0, total: shiftsToSave.length });

        // Subida a Firebase en bloques para no saturar la red
        for (let i = 0; i < shiftsToSave.length; i++) {
            try {
                await actions.addShift(shiftsToSave[i]);
                setProgress(prev => ({ ...prev, current: i + 1 }));
            } catch (e) {
                newLog.push(`❌ Error en línea ${shiftsToSave[i].lineRef}: ${e.message}`);
            }
        }

        setLog(newLog.length ? newLog : [`✅ Éxito: ${shiftsToSave.length} registros procesados.`]);
        setStatus('done');
    };

    return (
        <div className="fade-in" style={{ padding: '1rem', paddingBottom: '100px' }}>
            <div className="card">
                <h2>📥 Importación de Datos</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Copiá y pegá tus columnas desde Excel o Google Sheets.
                </p>

                <textarea
                    style={{
                        width: '100%',
                        height: '250px',
                        background: 'white',
                        color: 'black',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '2px solid #eee',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        marginTop: '10px'
                    }}
                    placeholder="Fecha | Uber | Didi | Otros | Horas"
                    value={textData}
                    onChange={(e) => setTextData(e.target.value)}
                />

                {status === 'processing' && (
                    <div style={{ marginTop: '1rem' }}>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>{progress.current} / {progress.total} registros</p>
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
                    <button
                        className="btn-primary"
                        onClick={processData}
                        disabled={status === 'processing' || !textData}
                    >
                        {status === 'processing' ? 'Subiendo...' : 'Iniciar Importación'}
                    </button>
                    <button
                        onClick={() => { setTextData(''); setLog([]); setStatus('idle'); }}
                        style={{ background: 'none', border: '1px solid #ccc', borderRadius: '12px', padding: '0 15px' }}
                    >
                        Limpiar
                    </button>
                </div>

                {log.length > 0 && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '10px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        maxHeight: '150px',
                        overflowY: 'auto'
                    }}>
                        {log.map((l, i) => <div key={i} style={{ marginBottom: '5px' }}>{l}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}