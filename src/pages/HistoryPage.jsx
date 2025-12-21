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
            groups[dKey].totalHours += shift.hours;
            groups[dKey].totalKm += shift.km;

            // Solo agregamos a la lista visual si NO es un registro de metadatos 'Reporte Diario'
            if (shift.platform !== 'Reporte Diario') {
                groups[dKey].apps.push({
                    name: shift.platform,
                    money: shift.earnings,
                    id: shift.id
                });
            }
        });

        // Ordenar por fecha descendente
        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [shifts]);

    const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // Helper para fecha bonita
    const formatDate = (dateString) => {
        if (!dateString) return 'VACIO';
        const d = new Date(dateString + 'T00:00:00');
        // DEBUG: Si falla, mostramos el valor real para ver qué está mal
        if (isNaN(d.getTime())) return `ERROR_FECHA: [${dateString}]`;
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="history-page fade-in pb-24 w-full">
            <div className="flex flex-col gap-4">

                {/* Header del Mes (Navegación) - Usando Grid para forzar estructura */}
                <div className="card sticky top-[70px] z-20 shadow-sm mb-2 p-3 bg-white/95 backdrop-blur rounded-2xl">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        {/* Botón Anterior */}
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-3 bg-gray-50 rounded-xl text-gray-600 hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95 shadow-sm justify-self-start"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="20" height="20" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        {/* Título Centrado */}
                        <h2 className="text-xl font-black text-gray-800 capitalize text-center w-full">
                            {monthLabel}
                        </h2>

                        {/* Botón Siguiente */}
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-3 bg-gray-50 rounded-xl text-gray-600 hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95 shadow-sm justify-self-end"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="20" height="20" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Lista Agrupada */}
                <div className="flex flex-col gap-4 w-full">
                    {dailyShifts.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 opacity-60">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="64" height="64" className="w-16 h-16 mx-auto mb-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0h18M5.25 12h13.5h-13.5Zm0 5.25h13.5h-13.5Z" />
                            </svg>
                            <p className="text-lg font-medium">Sin movimientos</p>
                        </div>
                    ) : (
                        dailyShifts.map(group => (
                            <div key={group.date} className="card p-0 overflow-hidden shadow-sm border border-gray-100 rounded-2xl bg-white w-full">
                                {/* Header del Día - Grid para alineación perfecta */}
                                <div className="bg-gray-50/80 px-5 py-4 grid grid-cols-[1fr_auto] items-center gap-4 border-b border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="capitalize font-bold text-gray-800 text-lg leading-tight">
                                            {formatDate(group.date)}
                                        </span>
                                    </div>
                                    <span className="font-black text-xl text-[var(--primary)] tracking-tight whitespace-nowrap">
                                        ${group.totalEarnings.toLocaleString()}
                                    </span>
                                </div>

                                {/* Cuerpo (Lista de Apps) - Grid 2 Columnas */}
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {group.apps.map(app => (
                                        <div key={app.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            {/* Indicador Visual App */}
                                            <div className={`w-2 h-2 rounded-full ${app.name === 'Uber' ? 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.3)]' :
                                                    app.name === 'Didi' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' :
                                                        app.name === 'Cabify' ? 'bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.4)]' :
                                                            'bg-gray-400'
                                                }`}></div>

                                            <span className="font-semibold text-gray-700 text-sm truncate">{app.name}</span>

                                            <div className="flex items-center gap-2 justify-self-end">
                                                <span className="font-bold text-gray-900 text-sm">${app.money.toLocaleString()}</span>
                                                <button
                                                    onClick={() => actions.deleteShift(app.id)}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors"
                                                    aria-label="Eliminar"
                                                >
                                                    <span className="text-base leading-none font-bold pb-0.5">×</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer (Totales Operativos) */}
                                <div className="px-5 py-3 bg-[var(--bg-app)]/50 border-t border-gray-50 flex justify-end gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className="w-4 h-4 opacity-70">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                                        </svg>
                                        <span>{Math.round(group.totalHours)}hs</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className="w-4 h-4 opacity-70">
                                            <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 0 0 2 4.607V10.5h9V4.606c0-.82-.668-1.487-1.49-1.49H6.5ZM19.607 5.09a1.49 1.49 0 0 0-1.125-.483c-1.032-.077-2.074-.117-3.125-.117h-2.25v6h7.917l-.87-5.321.003.011ZM11.125 12v6h2.25v-6h-2.25ZM9.875 12H7.625v6h2.25v-6ZM5.375 12H3.125v6h2.25v-6Z" />
                                        </svg>
                                        <span>{Math.round(group.totalKm)}km</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
