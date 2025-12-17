import { useDriver } from '../context/DriverContext';

export function HistoryPage() {
    const { shifts, actions } = useDriver();

    return (
        <div className="history-page fade-in">
            <div className="card list-card">
                <h2>Historial de Actividad</h2>
                <div className="shift-list">
                    {shifts.length === 0 ? (
                        <p className="empty-state">No hay registros aún.</p>
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
                                    <div className="shift-stats">
                                        <span className="shift-hours">{shift.hours}h</span>
                                        <span className="shift-earnings text-accent">+${shift.earnings.toLocaleString()}</span>
                                    </div>
                                    <button
                                        className="btn-delete"
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
