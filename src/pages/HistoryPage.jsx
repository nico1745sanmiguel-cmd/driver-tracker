import { useDriver } from '../context/DriverContext';

import { useMemo } from 'react';
import { useDriver } from '../context/DriverContext';

export function HistoryPage() {
    const { shifts, actions, currentDate } = useDriver();

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        actions.setMonth(newDate);
    };

    // Agrupar turnos por día
    const dailyShifts = useMemo(() => {
        const groups = {};
        shifts.forEach(shift => {
            const dateParams = new Date(shift.date);
            // Ajuste zona horaria manual simple si es necesario, pero date string suele ser YYYY-MM-DD
            const dKey = shift.date;

            if (!groups[dKey]) {
                groups[dKey] = {
                    date: dKey,
                    totalEarnings: 0,
                    totalHours: 0,
                    totalKm: 0,
                    apps: []
                };
            }

            groups[dKey].totalEarnings += shift.earnings;
            groups[dKey].totalHours = Math.max(groups[dKey].totalHours, shift.hours); // OJO: Si se dividió, sumar da el total. Si es global, es el mismo.
            // En nuestra lógica actual, dividimos el global entre las apps. Así que SUMAR las partes reconstruye el total.
            // Verify: Dashboard divide globalHours * ratio. Sum(parts) ~= globalHours.

            // Corrección: Como los floats pueden variar levemente, mejor sumamos.
            groups[dKey].totalHours += shift.hours;
            groups[dKey].totalKm += shift.km;

            groups[dKey].apps.push({
                name: shift.platform,
                money: shift.earnings,
                id: shift.id
            });
        });

        // Ordenar por fecha descendente
        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [shifts]);

    const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // Helper para fecha bonita
    const formatDate = (dateString) => {
        const d = new Date(dateString + 'T00:00:00');
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="history-page fade-in pb-24">
            <div className="flex flex-col gap-4">

                {/* Header del Mes */}
                <div className="card sticky top-[70px] z-20 shadow-md mb-2 p-3 bg-white/95 backdrop-blur">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-700 capitalize w-32">{monthLabel}</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button onClick={() => changeMonth(1)} className="p-2 bg-gray-100 rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista Agrupada */}
                <div className="flex flex-col gap-3">
                    {dailyShifts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p className="text-lg">😴 No hay actividad</p>
                            <p className="text-sm">¡A trabajar!</p>
                        </div>
                    ) : (
                        dailyShifts.map(group => (
                            <div key={group.date} className="card p-0 overflow-hidden border border-gray-100">
                                {/* Header del Día */}
                                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="capitalize font-bold text-[var(--text-main)] text-lg">
                                            {formatDate(group.date)}
                                        </span>
                                    </div>
                                    <span className="font-black text-xl text-[var(--primary)]">
                                        ${group.totalEarnings.toLocaleString()}
                                    </span>
                                </div>

                                {/* Cuerpo (Grid de Apps) */}
                                <div className="p-3 grid grid-cols-2 gap-2">
                                    {group.apps.map(app => (
                                        <div key={app.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-6 rounded-full ${app.name === 'Uber' ? 'bg-black' :
                                                        app.name === 'Didi' ? 'bg-orange-500' :
                                                            app.name === 'Cabify' ? 'bg-purple-600' : 'bg-gray-400'
                                                    }`}></div>
                                                <span className="text-sm font-semibold text-gray-600">{app.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-800 text-sm">${app.money.toLocaleString()}</span>
                                                <button
                                                    onClick={() => actions.deleteShift(app.id)}
                                                    className="opacity-20 hover:opacity-100 text-red-500 transition-opacity px-1"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer (Totales Operativos) */}
                                <div className="px-4 py-2 bg-[var(--bg-app)] text-xs font-bold text-gray-400 flex justify-end gap-4 uppercase tracking-wide">
                                    <span>⏱️ {Math.round(group.totalHours)}hs</span>
                                    <span>🚗 {Math.round(group.totalKm)}km</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
