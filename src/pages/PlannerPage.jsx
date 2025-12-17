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
    const { monthlyConfig, actions, stats } = useDriver();

    // We keep a local string state for the input to allow formatting
    const [localBudget, setLocalBudget] = useState('');
    const [localConfig, setLocalConfig] = useState(monthlyConfig);
    const [isDirty, setIsDirty] = useState(false);

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

    const { plan } = stats;

    return (
        <div className="planner-page fade-in">
            <div className="card planner-card">
                <div className="planner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Configuración del Plan</h2>
                    {isDirty && <span style={{ color: 'var(--accent-didi)', fontSize: '0.9rem' }}>● Cambios sin guardar</span>}
                </div>

                <div className="form-group">
                    <label>Meta Mensual ($)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={localBudget}
                        onChange={handleBudgetChange}
                        placeholder="Ej. 500.000"
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
                                {day.label.slice(0, 2)}
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
                                {day.label.slice(0, 2)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-row">
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
                        <span className="goal-value">${Math.round(plan.normalGoal).toLocaleString()}</span>
                    </div>
                    <div className="goal-item highlight">
                        <span className="goal-label">Día Fuerte (x2)</span>
                        <span className="goal-value">${Math.round(plan.highGoal).toLocaleString()}</span>
                    </div>
                </div>
                <p className="work-days-summary">
                    Basado en tu configuración actual, trabajarás <strong>{plan.totalWorkDays}</strong> días este mes.
                </p>
            </div>
        </div>
    );
}
