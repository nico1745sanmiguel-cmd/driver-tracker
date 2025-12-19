import { useDriver } from '../context/DriverContext';

export function HistoryPage() {
    const { shifts, actions, currentDate } = useDriver();

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        actions.setMonth(newDate);
    };

    const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
        <div className="history-page fade-in pb-24">
            <div className="card list-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold m-0">Historial</h2>

                    <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="text-xl text-gray-500 hover:text-[var(--primary)] font-bold px-2"
                        >
                            ‹
                        </button>
                        <span className="capitalize font-semibold min-w-[120px] text-center text-sm">
                            {monthLabel}
                        </span>
                        <button
                            onClick={() => changeMonth(1)}
                            className="text-xl text-gray-500 hover:text-[var(--primary)] font-bold px-2"
                        >
                            ›
                        </button>
                    </div>
                </div>

                <div className="shift-list">
                    {shifts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p>No hay registros en este mes.</p>
                        </div>
                    ) : (
                        shifts.map(shift => (
                            <div key={shift.id} className="shift-item">
                                <div className="shift-left">
                                    <div className="shift-info">
                                        <span className={`platform-tag ${shift.platform.toLowerCase()}`}>
                                            {shift.platform}
                                        </span>
                                        <span className="shift-date">{new Date(shift.date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="shift-right">
                                    <div className="shift-stats flex flex-col items-end">
                                        <span className="shift-earnings text-accent font-bold">+${shift.earnings.toLocaleString()}</span>
                                        <div className="text-xs text-gray-400 mt-1">
                                            <span className="mr-2">{shift.hours}h</span>
                                            {shift.km > 0 && <span>• {shift.km}km</span>}
                                        </div>
                                    </div>
                                    <button
                                        className="btn-delete mt-2 text-red-300 hover:text-red-500"
                                        onClick={() => actions.deleteShift(shift.id)}
                                        title="Eliminar registro"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
