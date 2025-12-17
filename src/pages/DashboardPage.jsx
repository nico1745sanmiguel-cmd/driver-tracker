import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

// Helper to format currency numbers with thousands separator
const formatNumber = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, ''); // strip non-digits
    return new Intl.NumberFormat('es-CL').format(num); // using Chilean Spanish locale for standard dots (1.000)
};

// Helper to parse formatted string back to raw number
const parseNumber = (val) => {
    return val.replace(/\./g, '');
};

export function DashboardPage() {
    const { stats, actions, monthlyConfig } = useDriver();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [platform, setPlatform] = useState('Uber');
    const [hours, setHours] = useState('');
    const [earnings, setEarnings] = useState('');

    const handleEarningsChange = (e) => {
        const val = e.target.value;
        // Allow only numbers and dots/commas
        const raw = val.replace(/[^0-9]/g, '');
        setEarnings(formatNumber(raw));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const rawEarnings = parseNumber(earnings);
        if (!hours || !rawEarnings) return;

        actions.addShift({
            date,
            platform,
            hours: parseFloat(hours),
            earnings: parseFloat(rawEarnings)
        });
        setHours('');
        setEarnings('');
    };

    const { plan } = stats;
    // Calculate today's target
    const currentDay = new Date(date + 'T00:00:00');
    const dayOfWeek = currentDay.getDay();
    let todayTarget = 0;
    let isStrong = false;
    let isRest = false;

    if (plan) {
        if (monthlyConfig.offDays.includes(dayOfWeek)) {
            isRest = true;
        } else if (monthlyConfig.highDemandDays.includes(dayOfWeek)) {
            todayTarget = plan.highGoal;
            isStrong = true;
        } else {
            todayTarget = plan.normalGoal;
        }
    }

    return (
        <div className="dashboard-page fade-in">
            {/* Target Banner */}
            {monthlyConfig.budget > 0 && (
                <div className="card progress-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="progress-info" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Progreso Mensual</span>
                        <span>{plan.currentProgress.toFixed(1)}% de ${parseInt(monthlyConfig.budget).toLocaleString()}</span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${plan.currentProgress}%` }}
                        ></div>
                    </div>

                    <div className="today-target-banner" style={{
                        background: isRest ? 'var(--bg-secondary)' : (isStrong ? 'rgba(56, 189, 248, 0.1)' : 'transparent'),
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isStrong ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        textAlign: 'center'
                    }}>
                        <h3>Objetivo para {currentDay.toLocaleDateString('es-ES', { weekday: 'long' })}</h3>
                        {isRest ? (
                            <p className="text-secondary">¡Día de Descanso! Disfruta.</p>
                        ) : (
                            <p className="stat-value text-accent">${Math.round(todayTarget).toLocaleString()}</p>
                        )}
                        {isStrong && <span className="badge-strong">🔥 Día Fuerte (x2)</span>}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="card stat-card">
                    <h3>Ganancias Totales</h3>
                    <p className="stat-value text-accent">${stats.totalEarnings.toLocaleString()}</p>
                </div>
                <div className="card stat-card">
                    <h3>Horas Trabajadas</h3>
                    <p className="stat-value">{stats.totalHours}h</p>
                </div>
                <div className="card stat-card">
                    <h3>Promedio / Hora</h3>
                    <p className="stat-value">${stats.hourlyRate}</p>
                </div>
            </div>

            {/* Entry Form */}
            <div className="card form-card">
                <h2>Registrar Turno</h2>
                <form onSubmit={handleSubmit} className="shift-form">
                    <div className="form-group">
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Plataforma</label>
                        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                            <option value="Uber">Uber</option>
                            <option value="Didi">Didi</option>
                            <option value="Cabify">Cabify</option>
                            <option value="Indriver">Indriver</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Horas</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                min="0"
                                placeholder="Ej. 5"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Ganancia ($)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Ej. 30.000"
                                value={earnings}
                                onChange={handleEarningsChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary">
                        Agregar Registro
                    </button>
                </form>
            </div>
        </div>
    );
}
