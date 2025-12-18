import { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import { useNavigate } from 'react-router-dom';

export function ImportPage() {
    const { actions } = useDriver();
    const [textData, setTextData] = useState(`15/12/2025	88.540,00	20.389,00		6
14/12/2025	71.553,00	88.719,00	10.000,00	8
13/12/2025	141.730,00			8
12/12/2025	120.921,00	19.772,00		6
11/12/2025	61.645,00	59.544,00		6
10/12/2025				0
9/12/2025				0
8/12/2025	70.128,00	67.990,00		6
7/12/2025	128.298,00	47.380,00		8
6/12/2025	176.512,00			8
5/12/2025	61.308,00	53.536,00		6
4/12/2025	99.089,00	22.306,00		6
3/12/2025				0
2/12/2025				0
1/12/2025	30.344,00	9.891,00		6
30/11/2025	48.322,00	42.372,00		8
29/11/2025	56.029,00	98.399,00		8
28/11/2025	9.532,00	47.665,00		6
27/11/2025	83.500,00	8.448,00		6
26/11/2025				0
25/11/2025	2.785,00	128.383,00		0
24/11/2025				6
23/11/2025	68.312,00	103.146,00		8
22/11/2025	65.887,00	100.469,00		8
21/11/2025	71.295,00	22.494,00		6
20/11/2025	20.780,00	42.136,00		6
19/11/2025				0
18/11/2025				0
17/11/2025	26.542,00	45.588,00		6
16/11/2025	8.714,00	190.993,00	5.000,00	8
15/11/2025	86.163,00	85.864,00		8
14/11/2025	21.999,00	46.777,00		6
13/11/2025	29.549,00	45.949,00		6
12/11/2025				0
11/11/2025				0
10/11/2025	19.963,00	29.282,00	56.000,00	6
9/11/2025	29.425,00	104.235,00	0,00	8
8/11/2025	61.102,00	56.709,00	0,00	8
7/11/2025	15.569,00	57.170,00	0,00	6
6/11/2025	23.892,00	57.087,00	0,00	6
5/11/2025	0,00	0,00	0,00	0
4/11/2025	0,00	0,00	0,00	0
3/11/2025	6.659,00	62.295,00	0,00	6
2/11/2025	72.851,00	141.148,00	0,00	8
1/11/2025	0,00	0,00	0,00	8
31/10/2025	60.292,00	23.129,00	0,00	6
30/10/2025	29.508,00	32.393,00	0,00	6
29/10/2025	28.066,00	28.116,00	0,00	0
28/10/2025	0,00	0,00	0,00	0
27/10/2025	27.064,00	39.866,00	0,00	6
26/10/2025	128.556,00	21.770,00	0,00	8
25/10/2025	136.997,00	32.558,00	0,00	8
24/10/2025	72.894,00	40.372,00	0,00	6
23/10/2025	22.513,00	31.709,00	0,00	6
22/10/2025	0,00	0,00	0,00	0
21/10/2025	0,00	0,00	0,00	0
20/10/2025	20.826,00	76.370,00	0,00	6
19/10/2025	18.367,00	75.191,00	0,00	8
18/10/2025	29.661,00	175.792,00	0,00	8
17/10/2025	6.630,00	15.089,00	0,00	6
16/10/2025	0,00	0,00	0,00	6
15/10/2025	0,00	0,00	0,00	0
14/10/2025	0,00	0,00	0,00	0
13/10/2025	46.724,00	17.000,00	43.000,00	6
12/10/2025	22.645,00	79.572,00	64.000,00	8
11/10/2025	84.990,00	15.669,00	92.000,00	8
10/10/2025	35.838,00	51.935,00		6
9/10/2025	15.225,00	28.765,00	20.000,00	6
8/10/2025	0,00	0,00	0,00	0
7/10/2025	0,00	0,00	0,00	0
6/10/2025	78.734,00	5.000,00	0,00	6
5/10/2025	133.585,00	20.504,00	10.000,00	8
4/10/2025	80.090,00	60.227,00	33.590,00	8
3/10/2025	0,00	0,00	0,00	6
2/10/2025	26.670,00	29.000,00	52.000,00	6
1/10/2025	0,00	0,00	0,00	0
30/9/2025	0,00	0,00	0,00	0
29/9/2025	28.333,00	25.479,00	30.000,00	6
28/9/2025	0,00	0,00	0,00	8
27/9/2025	49.053,00	56.605,00	0,00	8
26/9/2025	30.828,00	9.159,00	23.600,00	6
25/9/2025	40.185,00	37.700,00	16.000,00	6
24/9/2025	0,00	0,00	0,00	0
23/9/2025	0,00	0,00	0,00	0
22/9/2025	15.929,00	40.059,00	22.000,00	6
21/9/2025	60.252,00	56.606,00	53.000,00	8
20/9/2025	47.435,00	26.007,00	40.000,00	8
19/9/2025	20.378,00	26.502,00	47.000,00	6
18/9/2025	32.893,00	14.934,00	44.000,00	6
17/9/2025	0,00	0,00	0,00	0
16/9/2025	0,00	0,00	0,00	0
15/9/2025	72.966,00	0,00	0,00	6
14/9/2025	55.399,00	14.642,00	45.900,00	8
13/9/2025	75.209,00	85.233,00	0,00	8
12/9/2025	40.840,00	7.320,00	19.300,00	6
11/9/2025	25.492,00	27.030,00	0,00	6
10/9/2025	44.114,00	5.211,00	0,00	0
9/9/2025	0,00	0,00	0,00	0
8/9/2025	0,00	0,00	0,00	6
7/9/2025	77.505,00	41.113,00	65.000,00	8
6/9/2025	65.615,00	73.169,00	15.000,00	8
5/9/2025	52.473,00	25.283,00	30.000,00	6
4/9/2025	47.752,00	31.832,00	0,00	6
3/9/2025	0,00	0,00	0,00	0
2/9/2025	0,00	0,00	0,00	0
1/9/2025	145.912,00	16.847,00	0,00	6`);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [log, setLog] = useState([]);
    const navigate = useNavigate();

    // Helper to parse CSV line respecting quotes and stripping them
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const parseCurrency = (val) => {
        if (!val) return 0;
        // Clean non-numeric characters EXCEPT . , -
        const clean = val.toString().replace(/[^0-9,.-]/g, '');

        // Handle "55.762,00" format
        // Remove all dots (thousands)
        const noDots = clean.replace(/\./g, '');
        // Replace comma with dot (decimal)
        const standard = noDots.replace(/,/g, '.');

        const num = parseFloat(standard);
        return isNaN(num) ? 0 : num;
    };

    const parseHours = (val) => {
        if (!val) return 0;
        // Replace all commas with dots, then remove non-numeric/dots
        const clean = val.toString().replace(/,/g, '.').replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    const parseDate = (val) => {
        if (!val) return null;
        // Strip quotes if present
        const cleanVal = val.replace(/['"]/g, '').trim();

        let parts;
        // Handle "YYYY-MM-DD" or "DD/MM/YYYY" or "D/M/YYYY"
        if (cleanVal.includes('-')) {
            return cleanVal;
        } else {
            parts = cleanVal.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
        }
        return null; // Return null if invalid to skip bad lines
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
        if (!textData) return;

        setStatus('processing');
        // Handle standard newlines
        const lines = textData.trim().split(/\r\n|\n/);
        const newLog = [];
        let successCount = 0;

        const shiftsToSave = [];

        // 1. First Pass: Parse all lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Skip header if strictly matches known headers
            if (line.toLowerCase().startsWith('fecha')) continue;

            // Use robust parser
            const parts = parseCSVLine(line);

            if (parts.length < 1) continue;

            const dateStr = parts[0];
            const date = parseDate(dateStr);

            // If date is invalid, it's garbage or header
            if (!date) continue;

            // Mapped based on screenshot: Date(0), Uber(1), Didi(2), Otros(3), Horas(4)
            // Safety checks for undefined
            const uber = parseCurrency(parts[1] || '0');
            const didi = parseCurrency(parts[2] || '0');
            const other = parseCurrency(parts[3] || '0');
            const totalHours = parseHours(parts[4] || '0');

            let platforms = [
                { name: 'Uber', amount: uber },
                { name: 'Didi', amount: didi },
                { name: 'Otros', amount: other }
            ].filter(p => p.amount > 0); // Only save platforms with money > 0

            // CASE: No earnings but hours worked (e.g. bad day or just tracking time)
            if (platforms.length === 0 && totalHours > 0) {
                platforms.push({ name: 'Otros', amount: 0 }); // Assign to Others by default
            }

            if (platforms.length === 0) continue; // Skip completely empty rows (0 money, 0 hours)

            // Find max earner to assign hours
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
                    lineIndex: i + 1
                });
            }
        }

        setProgress({ current: 0, total: shiftsToSave.length });

        // 2. Second Pass: Batch Upload
        // Lower batch size to 3 to handle potential network hiccups
        const BATCH_SIZE = 3;

        for (let i = 0; i < shiftsToSave.length; i += BATCH_SIZE) {
            const batch = shiftsToSave.slice(i, i + BATCH_SIZE);

            // Create promises with Timeout Safety
            const promises = batch.map(async (shift) => {
                try {
                    // Create a race between the action and a 5s timeout
                    const timeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout de red')), 8000)
                    );

                    await Promise.race([
                        actions.addShift({
                            date: shift.date,
                            platform: shift.platform,
                            hours: shift.hours,
                            earnings: shift.earnings
                        }),
                        timeout
                    ]);

                    return { success: true };
                } catch (e) {
                    console.error("Fallo al subir:", shift, e);
                    return { success: false, error: e.message || 'Error desconocido', shift };
                }
            });

            // Wait for this batch
            const results = await Promise.all(promises);

            // Process results
            results.forEach(res => {
                if (res.success) {
                    successCount++;
                } else {
                    newLog.push(`❌ Linea ${res.shift.lineIndex} (${res.shift.platform}): ${res.error}`);
                }
            });

            // Update Progress UI
            setProgress(prev => ({ ...prev, current: Math.min(prev.total, i + BATCH_SIZE) }));
        }

        if (newLog.length === 0) {
            newLog.push(`✅ Éxito total. ${successCount} registros importados.`);
        } else {
            newLog.push(`⚠️ Proceso terminado. ${successCount} importados, ${newLog.length} fallidos.`);
        }

        setLog(newLog);
        setStatus('done');
    };

    return (
        <div className="fade-in" style={{ padding: '1rem' }}>
            <div className="card">
                <h2>📥 Importación Histórica</h2>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Formato:</strong> Fecha, Uber, Didi, Otros, Horas</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Soporta CSV de Excel (con comillas y puntos de mil)</p>
                </div>

                {/* File Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="btn-secondary" style={{ display: 'inline-block', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                        📂 Seleccionar Archivo CSV
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <div style={{ position: 'relative' }}>
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
                            whiteSpace: 'pre',
                            fontSize: '0.8rem'
                        }}
                        placeholder={`... o pega el contenido aquí ...\n1/10/2024,"0,00","0,00","0,00",0`}
                        value={textData}
                        onChange={(e) => setTextData(e.target.value)}
                    />
                    {textData && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.7rem', background: '#22c55e', padding: '2px 6px', borderRadius: '10px' }}>
                            Datos cargados
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {status === 'processing' && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: '#38bdf8' }}>Procesando... no cierres la página</span>
                            <span style={{ fontSize: '0.9rem' }}>{Math.round((progress.current / (progress.total || 1)) * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(progress.current / (progress.total || 1)) * 100}%`,
                                height: '100%',
                                background: '#3b82f6',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                            {progress.current} / {progress.total} registros
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={processData}
                        disabled={status === 'processing' || !textData}
                    >
                        {status === 'processing' ? 'Procesando...' : 'Iniciar Importación'}
                    </button>

                    <button
                        className="btn-delete"
                        onClick={() => { setTextData(''); setLog([]); setStatus('idle'); }}
                        disabled={status === 'processing'}
                        style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                    >
                        Limpiar
                    </button>
                </div>

                {log.length > 0 && (
                    <div style={{ marginTop: '2rem', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        {log.map((entry, i) => (
                            <div key={i} style={{
                                color: entry.includes('❌') ? '#f87171' : (entry.includes('⚠️') ? '#fbbf24' : '#4ade80'),
                                marginBottom: '0.25rem',
                                fontSize: '0.85rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                paddingBottom: '2px'
                            }}>
                                {entry}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
