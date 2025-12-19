import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

export function DashboardPage() {
    const { stats, actions, monthlyConfig } = useDriver();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [platform, setPlatform] = useState('Uber');
    const [hours, setHours] = useState('');
    const [earnings, setEarnings] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const rawEarnings = earnings.replace(/\./g, '');
        if (!hours || !rawEarnings) return;
        actions.addShift({ date, platform, hours: parseFloat(hours), earnings: parseFloat(rawEarnings) });
        setHours(''); setEarnings('');
    };

    // --- Lógica de Meta de Hoy con Vacaciones ---
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
        <div className="dashboard-page fade-in">
            {/* Banner Dinámico de Meta */}
            <div className="card target-card" style={{ borderLeft: `8px solid ${today.type === 'high' ? 'var(--primary)' : '#ccc'}` }}>
                <div className="progress-header">
                    <span>Progreso del Mes</span>
                    <strong>{stats.plan.currentProgress.toFixed(1)}%</strong>
                </div>
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.plan.currentProgress}%` }}></div></div>

                <div className="today-info">
                    <h4>Meta para hoy ({date}):</h4>
                    {today.type === 'vacation' || today.type === 'rest' ? (
                        <p className="status-msg">🏝️ ¡Día libre! Meta: $0</p>
                    ) : (
                        <h2 className="today-amount">${Math.round(today.target).toLocaleString()}</h2>
                    )}
                    {today.type === 'high' && <span className="badge">🔥 DÍA FUERTE (x2)</span>}
                </div>
            </div>

            {/* Formulario de Registro */}
            <div className="card form-card">
                <h3>Nuevo Viaje</h3>
                <form onSubmit={handleSubmit}>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                        <option>Uber</option><option>Didi</option><option>Cabify</option><option>Particular</option>
                    </select>
                    <div className="input-group">
                        <input type="number" step="0.5" placeholder="Horas" value={hours} onChange={(e) => setHours(e.target.value)} />
                        <input type="text" placeholder="Plata ($)" value={earnings} onChange={(e) => setEarnings(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))} />
                    </div>
                    <button type="submit" className="btn-primary">GUARDAR REGISTRO</button>
                </form>
            </div>
        </div>
    );
}