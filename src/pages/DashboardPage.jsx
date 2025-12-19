import { useState, useMemo, useEffect } from 'react';
import { useDriver } from '../context/DriverContext';

const APPS = ['Uber', 'Didi', 'Cabify', 'Particular'];

export function DashboardPage() {
    const { stats, actions, monthlyConfig } = useDriver();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Default: Hoy
    const [showToast, setShowToast] = useState(false);

    // Estado para ganancias por App
    const [earnings, setEarnings] = useState(
        APPS.reduce((acc, app) => ({ ...acc, [app]: '' }), {})
    );

    // Estado para Totales Globales
    const [globalStats, setGlobalStats] = useState({
        time: '', // Formato HH:MM
        km: ''
    });

    // Auto-ocultar Toast
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // Helpers de Formato
    const formatCurrency = (val) => {
        const clean = val.replace(/\D/g, '');
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const cleanCurrency = (val) => parseFloat(val.replace(/\./g, '')) || 0;

    // --- MANEJO DE TIEMPO INTELIGENTE ---
    const handleTimeChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        setGlobalStats(prev => ({ ...prev, time: val }));
    };

    const formatTimeDisplay = (raw) => {
        if (!raw) return '';
        if (raw.length < 3) return raw + 'm';
        const minutes = raw.slice(-2);
        const hours = raw.slice(0, -2);
        return `${hours}:${minutes}`;
    };

    // Manejadores Generales
    const handleEarningChange = (app, value) => {
        setEarnings(prev => ({ ...prev, [app]: formatCurrency(value) }));
    };

    const handleKmChange = (val) => {
        const clean = val.replace(/\D/g, '');
        setGlobalStats(prev => ({ ...prev, km: clean }));
    };

    // --- UX: Scroll y Navegación ---
    const handleFocus = (e) => {
        // Scroll suave para centrar el input y ver el de abajo
        setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const form = e.target.form;
            const index = Array.prototype.indexOf.call(form, e.target);
            const nextElement = form.elements[index + 1];
            if (nextElement) {
                nextElement.focus();
            } else {
                // Si es el último, intentar guardar
                e.target.blur();
            }
        }
    };

    // Cálculos en tiempo real
    const totals = useMemo(() => {
        let tMoney = 0;
        Object.values(earnings).forEach(val => tMoney += cleanCurrency(val));

        const timeStr = globalStats.time;
        let hrs = 0;
        let totalDuration = 0;

        if (timeStr.length > 0) {
            let h = 0, m = 0;
            if (timeStr.length <= 2) {
                m = parseInt(timeStr);
            } else {
                m = parseInt(timeStr.slice(-2));
                h = parseInt(timeStr.slice(0, -2));
            }
            totalDuration = h + (m / 60);
            hrs = h;
        }

        return { money: tMoney, duration: totalDuration, displayHours: hrs };
    }, [earnings, globalStats]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const totalMoney = totals.money;
        const totalKm = parseFloat(globalStats.km) || 0;
        const totalHours = totals.duration;

        if (totalMoney === 0) return;

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

        // Reset y Feedback
        setEarnings(APPS.reduce((acc, app) => ({ ...acc, [app]: '' }), {}));
        setGlobalStats({ time: '', km: '' });
        setShowToast(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="dashboard-page pb-40 fade-in max-w-lg mx-auto relative">
            {/* TOAST DE ÉXITO */}
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                    <span>¡Día guardado con éxito!</span>
                </div>
            </div>

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

                {/* GRUPO A: DATOS OPERATIVOS */}
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
                        {/* INPUT TIEMPO */}
                        <div className="p-4 flex flex-col items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Tiempo</label>
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Hs:Min"
                                    className="text-center text-3xl font-black text-[var(--text-main)] w-full outline-none placeholder:text-gray-200 tracking-widest"
                                    value={globalStats.time}
                                    onChange={handleTimeChange}
                                    onFocus={handleFocus}
                                    onKeyDown={handleKeyDown}
                                    maxLength={4}
                                />
                                <div className="absolute top-full left-0 w-full text-center pointer-events-none">
                                    <span className="text-xs font-bold text-[var(--primary)] bg-red-50 px-2 py-0.5 rounded">
                                        {formatTimeDisplay(globalStats.time) || '0:00'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* INPUT KM */}
                        <div className="p-4 flex flex-col items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Distancia</label>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="text-center text-3xl font-black text-[var(--text-main)] w-24 outline-none placeholder:text-gray-200"
                                    value={globalStats.km}
                                    onChange={(e) => handleKmChange(e.target.value)}
                                    onFocus={handleFocus}
                                    onKeyDown={handleKeyDown}
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
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="0"
                                        className={`text-right w-32 p-2 bg-transparent outline-none font-mono text-lg font-bold transition-all ${earnings[app] ? 'text-[var(--text-main)]' : 'text-gray-400'}`}
                                        value={earnings[app]}
                                        onChange={(e) => handleEarningChange(app, e.target.value)}
                                        onFocus={handleFocus}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTÓN Y RESUMEN */}
                <div className="sticky bottom-4 z-10 px-0">
                    <button
                        type="submit"
                        disabled={totals.money === 0}
                        className="btn-primary flex justify-between items-center shadow-xl hover:shadow-2xl transition-all"
                    >
                        <div className="text-left">
                            <p className="text-xs text-white/80 uppercase font-bold">Total Diario</p>
                            <p className="text-2xl font-black text-white">${totals.money.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm shadow-inner">
                            <span className="font-bold tracking-wide">GUARDAR</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
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