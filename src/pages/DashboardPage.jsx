import { useState, useMemo } from 'react';
import { useDriver } from '../context/DriverContext';

const APPS = ['Uber', 'Didi', 'Cabify', 'Particular'];

export function DashboardPage() {
    const { stats, actions, monthlyConfig } = useDriver();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Default: Hoy

    // Estado para ganancias por App
    const [earnings, setEarnings] = useState(
        APPS.reduce((acc, app) => ({ ...acc, [app]: '' }), {})
    );

    // Estado para Totales Globales
    const [globalStats, setGlobalStats] = useState({
        time: '', // Formato HH:MM
        km: ''
    });

    // Helpers de Formato
    const formatCurrency = (val) => {
        const clean = val.replace(/\D/g, '');
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const cleanCurrency = (val) => parseFloat(val.replace(/\./g, '')) || 0;

    // --- MANEJO DE TIEMPO ORGÁNICO ---
    const handleTimeChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Solo números
        if (val.length > 4) val = val.slice(0, 4);   // Max 4 dígitos

        // Auto-insertar dos puntos
        if (val.length >= 3) {
            val = val.slice(0, 2) + ':' + val.slice(2);
        }

        setGlobalStats(prev => ({ ...prev, time: val }));
    };

    // Manejadores Generales
    const handleEarningChange = (app, value) => {
        setEarnings(prev => ({ ...prev, [app]: formatCurrency(value) }));
    };

    const handleKmChange = (val) => {
        // Solo permitir números
        const clean = val.replace(/\D/g, '');
        setGlobalStats(prev => ({ ...prev, km: clean }));
    };

    // Cálculos en tiempo real
    const totals = useMemo(() => {
        let tMoney = 0;
        Object.values(earnings).forEach(val => tMoney += cleanCurrency(val));

        // Parsear hora HH:MM a decimal
        const timeStr = globalStats.time.replace(':', '');
        let hrs = 0;
        let totalDuration = 0;

        if (timeStr.length >= 1) {
            const h = parseInt(timeStr.slice(0, 2)) || 0;
            const m = parseInt(timeStr.slice(2, 4)) || 0;
            totalDuration = h + (m / 60);
            hrs = h; // Solo visualización
        }

        return { money: tMoney, duration: totalDuration, displayHours: hrs };
    }, [earnings, globalStats]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const totalMoney = totals.money;
        const totalKm = parseFloat(globalStats.km) || 0;
        const totalHours = totals.duration;

        if (totalMoney === 0) return;

        // Distribución Proporcional
        const promises = Object.entries(earnings).map(([platformName, val]) => {
            const money = cleanCurrency(val);
            if (money > 0) {
                const ratio = money / totalMoney;
                const allocatedHours = parseFloat((totalHours * ratio).toFixed(2));
                const allocatedKm = Math.round(totalKm * ratio);

                return actions.addShift({
                    date,
                    platform: platformName,
                    hours: allocatedHours,
                    earnings: money,
                    km: allocatedKm
                });
            }
            return Promise.resolve();
        });

        await Promise.all(promises);

        // Reset
        setEarnings(APPS.reduce((acc, app) => ({ ...acc, [app]: '' }), {}));
        setGlobalStats({ time: '', km: '' });
    };

    // Meta del día
    const checkToday = () => {
        const current = new Date(date + 'T00:00:00');
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();

        let status = { target: 0, type: 'normal' };

        if (monthlyConfig.vacationStart && monthlyConfig.vacationEnd &&
            dateStr >= monthlyConfig.vacationStart && dateStr <= monthlyConfig.vacationEnd) {
            status.type = 'vacation';
        } else if (monthlyConfig.offDays.includes(dayOfWeek)) {
            status.type = 'rest';
        } else if (monthlyConfig.highDemandDays.includes(dayOfWeek)) {
            status.target = stats.plan.highGoal;
            status.type = 'high';
        } else {
            status.target = stats.plan.normalGoal;
        }
        return status;
    };
    const today = checkToday();

    return (
        <div className="dashboard-page pb-32 fade-in max-w-lg mx-auto">
            {/* 1. ENCUESTA DE DISPONIBILIDAD (META) */}
            <div className={`card mb-4 transition-all duration-300 ${today.type === 'high' ? 'border-l-4 border-orange-500 bg-orange-50' : ''}`}>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Meta para Hoy</p>
                        {today.type === 'vacation' || today.type === 'rest' ? (
                            <h2 className="text-2xl font-bold text-green-600">🏝️ Libre</h2>
                        ) : (
                            <h2 className="text-3xl font-black text-[var(--text-main)]">${Math.round(today.target).toLocaleString()}</h2>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Mensual</p>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--primary)] text-[var(--primary)]" style={{ width: `${Math.min(stats.plan.currentProgress, 100)}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-[var(--primary)]">{stats.plan.currentProgress.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. FORMULARIO PRINCIPAL */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* GRUPO A: DATOS OPERATIVOS (Fecha, Tiempo, Km) */}
                <div className="card p-0 overflow-hidden shadow-sm border border-gray-100">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-600 text-sm">📅 Fecha de Trabajo</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent font-bold text-[var(--text-main)] outline-none text-right"
                        />
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-gray-100">
                        {/* INPUT TIEMPO ORGÁNICO */}
                        <div className="p-4 flex flex-col items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Tiempo (HH:MM)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="00:00"
                                className="text-center text-2xl font-black text-[var(--text-main)] w-full outline-none placeholder:text-gray-200"
                                value={globalStats.time}
                                onChange={handleTimeChange}
                                maxLength={5}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Escribe ej: 0630</p>
                        </div>

                        {/* INPUT KM */}
                        <div className="p-4 flex flex-col items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Distancia</label>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="0"
                                    className="text-center text-2xl font-black text-[var(--text-main)] w-24 outline-none placeholder:text-gray-200"
                                    value={globalStats.km}
                                    onChange={(e) => handleKmChange(e.target.value)}
                                />
                                <span className="text-sm font-bold text-gray-400">km</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRUPO B: GANANCIAS POR APP */}
                <div className="card shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3">Recaudación por App</p>
                    <div className="flex flex-col gap-3">
                        {APPS.map(app => (
                            <div key={app} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-8 rounded-full ${earnings[app] ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}></div>
                                    <span className="font-bold text-gray-700">{app}</span>
                                </div>
                                <div className="relative">
                                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all ${earnings[app] ? 'text-[var(--primary)] font-bold' : 'text-gray-300'}`}>$</span>
                                    <input
                                        type="tel" // Fuerza numérico en iOS/Android
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0"
                                        className={`text-right w-32 p-2 bg-transparent outline-none font-mono text-lg font-bold transition-all ${earnings[app] ? 'text-[var(--text-main)]' : 'text-gray-400'}`}
                                        value={earnings[app]}
                                        onChange={(e) => handleEarningChange(app, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTÓN Y RESUMEN */}
                <div className="sticky bottom-20 z-10">
                    <button
                        type="submit"
                        disabled={totals.money === 0}
                        className="w-full bg-[var(--text-main)] text-white p-4 rounded-xl shadow-xl flex justify-between items-center transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        <div className="text-left">
                            <p className="text-xs text-gray-400 uppercase font-bold">Total Diario</p>
                            <p className="text-2xl font-bold">${totals.money.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                            <span className="font-bold">GUARDAR</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </button>
                    {totals.money > 0 && (
                        <p className="text-center text-xs text-gray-400 mt-2 font-medium">
                            Se guardarán {stats.plan.currentProgress > 0 ? 'tus registros' : 'tus primeros registros'} del día
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}