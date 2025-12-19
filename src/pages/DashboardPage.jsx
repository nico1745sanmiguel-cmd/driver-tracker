import { useState, useMemo } from 'react';
import { useDriver } from '../context/DriverContext';

const APPS = ['Uber', 'Didi', 'Cabify', 'Indriver', 'Particular'];

export function DashboardPage() {
    const { stats, actions, monthlyConfig } = useDriver();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Default: Hoy

    // Estado para ganancias por App
    const [earnings, setEarnings] = useState(
        APPS.reduce((acc, app) => ({ ...acc, [app]: '' }), {})
    );

    // Estado para Totales Globales
    const [globalStats, setGlobalStats] = useState({
        hours: '',
        minutes: '',
        km: ''
    });

    // Helpers de Formato
    const formatCurrency = (val) => {
        const clean = val.replace(/\D/g, '');
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const cleanCurrency = (val) => parseFloat(val.replace(/\./g, '')) || 0;

    // Manejadores
    const handleEarningChange = (app, value) => {
        setEarnings(prev => ({ ...prev, [app]: formatCurrency(value) }));
    };

    const handleGlobalChange = (field, value) => {
        setGlobalStats(prev => ({ ...prev, [field]: value }));
    };

    // Cálculos en tiempo real
    const totals = useMemo(() => {
        let tMoney = 0;
        Object.values(earnings).forEach(val => tMoney += cleanCurrency(val));

        const hrs = parseFloat(globalStats.hours) || 0;
        const mins = parseFloat(globalStats.minutes) || 0;
        const totalDuration = hrs + (mins / 60);

        return { money: tMoney, duration: totalDuration };
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
                // Cálculo de Proporción (Regla de 3 simple basada en ganancia)
                // Si ganaste el 50% de la plata en Uber, se te asigna el 50% del tiempo y km.
                const ratio = money / totalMoney;

                const allocatedHours = parseFloat((totalHours * ratio).toFixed(2));
                const allocatedKm = Math.round(totalKm * ratio); // Km enteros mejor

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

        // Resetear Formulario
        setEarnings(APPS.reduce((acc, app) => ({ ...acc, [app]: '' }), {}));
        setGlobalStats({ hours: '', minutes: '', km: '' });
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
        <div className="dashboard-page pb-32 fade-in">
            {/* Banner Dinámico de Meta */}
            <div className="card target-card mb-6" style={{ borderLeft: `8px solid ${today.type === 'high' ? 'var(--primary)' : '#ccc'}` }}>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 font-medium">Progreso Mensual</span>
                    <strong className="text-[var(--primary)] text-lg">{stats.plan.currentProgress.toFixed(1)}%</strong>
                </div>
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.plan.currentProgress}%` }}></div></div>
                <div className="mt-4 text-center">
                    <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-1">Meta Sugerida ({date})</h4>
                    {today.type === 'vacation' || today.type === 'rest' ? (
                        <p className="text-green-600 font-bold text-xl">🏝️ ¡Día libre!</p>
                    ) : (
                        <h2 className="text-4xl font-extrabold text-[var(--text-main)]">${Math.round(today.target).toLocaleString()}</h2>
                    )}
                    {today.type === 'high' && <span className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold mt-2">🔥 DÍA DE ALTA DEMANDA</span>}
                </div>
            </div>

            {/* Formulario Unificado */}
            <div className="card form-card">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold">Carga del Día</h3>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-2 border rounded-lg font-bold text-gray-700 outline-none focus:border-[var(--primary)] text-sm"
                    />
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Sección 1: Dinero por App */}
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">1. Ganancias ($)</p>
                    <div className="grid gap-3 mb-6">
                        {APPS.map(app => (
                            <div key={app} className="flex items-center gap-3">
                                <div className="w-24 font-bold text-sm text-gray-700">{app}</div>
                                <input
                                    type="text"
                                    placeholder="$0"
                                    className="flex-1 p-3 border rounded-lg text-right font-mono text-lg tracking-tight focus:border-[var(--primary)] outline-none"
                                    value={earnings[app]}
                                    onChange={(e) => handleEarningChange(app, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Sección 2: Operativa Global */}
                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">2. Datos Generales (Total del día)</p>
                    <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">TIEMPO CONECTADO</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Hs"
                                    className="w-full p-3 border rounded-lg text-center font-bold text-lg outline-none focus:border-[var(--primary)]"
                                    value={globalStats.hours}
                                    onChange={(e) => handleGlobalChange('hours', e.target.value)}
                                />
                                <span className="text-xl font-bold text-gray-300">:</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full p-3 border rounded-lg text-center font-bold text-lg outline-none focus:border-[var(--primary)]"
                                    value={globalStats.minutes}
                                    onChange={(e) => handleGlobalChange('minutes', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">KILÓMETROS</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-3 border rounded-lg text-center font-bold text-lg outline-none focus:border-[var(--primary)]"
                                    value={globalStats.km}
                                    onChange={(e) => handleGlobalChange('km', e.target.value)}
                                />
                                <span className="absolute right-3 top-4 text-xs font-bold text-gray-400">KM</span>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Totales */}
                    <div className="bg-[var(--text-main)] text-white p-4 rounded-xl shadow-lg mb-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Total Recaudado</p>
                            <p className="text-2xl font-black">${totals.money.toLocaleString()}</p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                            <p>{stats.plan.currentProgress > 10 ? '¡Buen trabajo!' : 'Comenzando...'}</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full py-4 text-lg font-bold shadow-xl hover:scale-[1.01] transition-transform"
                        disabled={totals.money === 0}
                    >
                        GUARDAR DÍA
                    </button>
                </form>
            </div>
        </div>
    );
}