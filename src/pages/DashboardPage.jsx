import { useState, useMemo } from 'react';
import { useDriver } from '../context/DriverContext';

const APPS = ['Uber', 'Didi', 'Cabify', 'Indriver', 'Particular'];

export function DashboardPage() {
    const { stats, actions, monthlyConfig } = useDriver();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    // Estado unificado para la grilla
    const [grid, setGrid] = useState(
        APPS.reduce((acc, app) => ({
            ...acc,
            [app]: { earnings: '', hours: '', km: '' }
        }), {})
    );

    // Helpers de Formato
    const formatCurrency = (val) => {
        // Eliminar puntos existentes y caracteres no numéricos
        const clean = val.replace(/\D/g, '');
        // Agregar puntos de mil
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const cleanCurrency = (val) => parseFloat(val.replace(/\./g, '')) || 0;

    // Manejador de Inputs
    const handleChange = (app, field, value) => {
        let finalValue = value;
        if (field === 'earnings') {
            finalValue = formatCurrency(value);
        }

        setGrid(prev => ({
            ...prev,
            [app]: { ...prev[app], [field]: finalValue }
        }));
    };

    // Cálculos en tiempo real
    const totals = useMemo(() => {
        let tMoney = 0;
        let tHours = 0;
        let tKm = 0;

        Object.values(grid).forEach(row => {
            tMoney += cleanCurrency(row.earnings);
            tHours += parseFloat(row.hours) || 0;
            tKm += parseFloat(row.km) || 0;
        });

        return { money: tMoney, hours: tHours, km: tKm };
    }, [grid]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const promises = Object.entries(grid).map(([platformName, data]) => {
            const money = cleanCurrency(data.earnings);
            const hrs = parseFloat(data.hours) || 0;
            const kms = parseFloat(data.km) || 0;

            // Solo guardamos si hay plata ingresada (asumimos que valida si trabajó)
            if (money > 0) {
                return actions.addShift({
                    date,
                    platform: platformName,
                    hours: hrs,
                    earnings: money,
                    km: kms // Nuevo campo
                });
            }
            return Promise.resolve();
        });

        await Promise.all(promises);

        // Resetear Formulario
        setGrid(APPS.reduce((acc, app) => ({ ...acc, [app]: { earnings: '', hours: '', km: '' } }), {}));
    };

    // --- Lógica de Diseño (Meta del día) ---
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

            {/* Nueva Grilla de Carga */}
            <div className="card form-card">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold">Resumen Diario</h3>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-2 border rounded-lg active:border-[var(--primary)] outline-none"
                    />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-8">
                        {/* Headers Grilla */}
                        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr] gap-2 text-xs font-bold text-gray-400 uppercase text-center md:text-left">
                            <span className="text-left pl-2">App</span>
                            <span>Ganancia</span>
                            <span>Hs</span>
                            <span>Km</span>
                        </div>

                        {APPS.map(app => (
                            <div key={app} className="grid grid-cols-[1fr_1.5fr_1fr_1fr] gap-2 items-center">
                                {/* Nombre APP */}
                                <div className="font-bold pl-2 text-sm">{app}</div>

                                {/* Ganancia */}
                                <input
                                    type="text"
                                    placeholder="$"
                                    className="p-2 border rounded text-right tracking-tighter"
                                    value={grid[app].earnings}
                                    onChange={(e) => handleChange(app, 'earnings', e.target.value)}
                                />

                                {/* Horas */}
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="h"
                                    className="p-2 border rounded text-center"
                                    value={grid[app].hours}
                                    onChange={(e) => handleChange(app, 'hours', e.target.value)}
                                />

                                {/* Kms */}
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="km"
                                    className="p-2 border rounded text-center"
                                    value={grid[app].km}
                                    onChange={(e) => handleChange(app, 'km', e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Barra de Totales Flotante/Fija en form */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                        <div className="flex justify-between items-end">
                            <div className="text-sm text-gray-500">
                                <div>Horas: <span className="font-bold text-gray-800">{totals.hours}h</span></div>
                                <div>Distancia: <span className="font-bold text-gray-800">{totals.km}km</span></div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-gray-400 uppercase">Total Diario</span>
                                <span className="text-2xl font-black text-[var(--primary)]">${totals.money.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform"
                        disabled={totals.money === 0}
                    >
                        <span>💾 GUARDAR DÍA COMPLETO</span>
                    </button>
                </form>
            </div>
        </div>
    );
}