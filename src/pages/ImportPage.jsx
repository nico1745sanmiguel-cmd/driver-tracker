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
        // Lower batch size to 5 to avoid potential strict rate limits or request size issues
        const BATCH_SIZE = 5;

        for (let i = 0; i < shiftsToSave.length; i += BATCH_SIZE) {
            const batch = shiftsToSave.slice(i, i + BATCH_SIZE);

            // Create promises
            const promises = batch.map(async (shift) => {
                try {
                    await actions.addShift({
                        date: shift.date,
                        platform: shift.platform,
                        hours: shift.hours,
                        earnings: shift.earnings
                    });
                    return { success: true };
                } catch (e) {
                    return { success: false, error: e.message, shift };
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
            newLog.push(`⚠️ Terminado con errores. ${successCount} importados.`);
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
