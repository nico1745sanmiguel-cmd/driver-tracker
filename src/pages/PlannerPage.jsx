import { useState, useEffect } from 'react';
import { useDriver } from '../context/DriverContext';

const DAYS_OF_WEEK = [
    { id: 1, label: 'Lunes' }, { id: 2, label: 'Martes' }, { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' }, { id: 5, label: 'Viernes' }, { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
];

// Reusing helper since it's small, in a real app would be shared util
const formatNumber = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('es-CL').format(num);
};

const parseNumber = (val) => {
    if (!val) return 0;
    return parseInt(val.toString().replace(/\./g, '')) || 0;
};

export function PlannerPage() {
    const { monthlyConfig, actions, stats, currentDate } = useDriver();

    // We keep a local string state for the input to allow formatting
    const [localBudget, setLocalBudget] = useState('');
    const [localConfig, setLocalConfig] = useState(monthlyConfig);
    const [isDirty, setIsDirty] = useState(false);
    const [showVacations, setShowVacations] = useState(false);

    useEffect(() => {
        setLocalConfig(monthlyConfig);
        setLocalBudget(formatNumber(monthlyConfig.budget));
    }, [monthlyConfig]);

    const handleBudgetChange = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        setLocalBudget(formatNumber(raw));

        // Update config immediately but parsed
        const parsed = parseNumber(raw);
        handleChange('budget', parsed);
    };

    const handleChange = (field, value) => {
        setLocalConfig(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const toggleDay = (dayId, listName) => {
        const currentList = localConfig[listName];
        const newList = currentList.includes(dayId)
            ? currentList.filter(id => id !== dayId)
            : [...currentList, dayId];
        handleChange(listName, newList);
    };

    const handleSave = () => {
        actions.updateConfig(localConfig);
        setIsDirty(false);
        alert('¡Plan guardado exitosamente!');
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        actions.setMonth(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        actions.setMonth(newDate);
    };

    const monthLabel = currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
    const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const { plan } = stats;

    return (
        <div className="planner-page fade-in">
            {/* Header with Navigation */}
            <div className="planner-header-nav">
                <button className="nav-arrow" onClick={handlePrevMonth}>&lt;</button>
                <h2>{capitalizedMonthLabel}</h2>
                <button className="nav-arrow" onClick={handleNextMonth}>&gt;</button>
            </div>

            <div className="card planner-card">
                <div className="planner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Configuración del Mes</h3>
                    {isDirty && <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '600' }}>● Cambios sin guardar</span>}
                </div>

                <div className="form-group">
                    <label>Meta Mensual ($)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={localBudget}
                        onChange={handleBudgetChange}
                        placeholder="Ej. 500.000"
                        className="budget-input"
                    />
                </div>

                <div className="form-group">
                    <label>Días de Descanso (Valen $0)</label>
                    <div className="day-selector">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={`off-${day.id}`}
                                className={`day-btn ${localConfig.offDays.includes(day.id) ? 'active off' : ''}`}
                                onClick={() => toggleDay(day.id, 'offDays')}
                                disabled={localConfig.highDemandDays.includes(day.id)} // Prevent overlap
                            >
                                {day.label.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Días Fuertes (Meta x2)</label>
                    <div className="day-selector">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={`high-${day.id}`}
                                className={`day-btn ${localConfig.highDemandDays.includes(day.id) ? 'active high' : ''}`}
                                onClick={() => toggleDay(day.id, 'highDemandDays')}
                                disabled={localConfig.offDays.includes(day.id)} // Prevent overlap
                            >
                                {day.label.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="vacation-section">
                    <button
                        className="text-btn toggle-vacation"
                        onClick={() => setShowVacations(!showVacations)}
                    >
                        {showVacations ? 'Ocultar Vacaciones' : 'Programar Vacaciones'}
                    </button>

                    {showVacations && (
                        <div className="form-row vacation-inputs fade-in">
                            <div className="form-group">
                                <label>Inicio Vacaciones</label>
                                <input
                                    type="date"
                                    value={localConfig.vacationStart}
                                    onChange={(e) => handleChange('vacationStart', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fin Vacaciones</label>
                                <input
                                    type="date"
                                    value={localConfig.vacationEnd}
                                    onChange={(e) => handleChange('vacationEnd', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="btn-primary"
                    onClick={handleSave}
                    style={{ marginTop: '1.5rem', width: '100%' }}
                >
                    Guardar Planificación
                </button>
            </div>

            {/* Preview of Impact */}
            <div className="card plan-summary" style={{ marginTop: '1.5rem' }}>
                <h3>Resumen del Impacto</h3>
                <div className="goals-grid">
                    <div className="goal-item">
                        <span className="goal-label">Día Normal</span>
                        <span className="goal-value">${Math.round(plan.normalGoal).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="goal-item highlight">
                        <span className="goal-label">Día Fuerte (x2)</span>
                        <span className="goal-value">${Math.round(plan.highGoal).toLocaleString('es-CL')}</span>
                    </div>
                </div>
                <p className="work-days-summary">
                    Trabajando <strong>{plan.totalWorkDays}</strong> días en {capitalizedMonthLabel}.
                </p>
            </div>
        </div>
    );
}
