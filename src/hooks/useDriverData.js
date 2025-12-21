import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebaseClient';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, where } from 'firebase/firestore';

export function useDriverData() {
    const [shifts, setShifts] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date()); // Para controlar el mes visible
    const [monthlyConfig, setMonthlyConfig] = useState({
        budget: 0, offDays: [], highDemandDays: [], vacationStart: '', vacationEnd: ''
    });

    // Helpers para fechas
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calcular primer y último día del mes en formato string YYYY-MM-DD para la query
    // Nota: Asumimos que las fechas en la DB están como "YYYY-MM-DD"
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Construct Config ID: "config_YYYY-MM"
    const configId = `config_${year}-${String(month + 1).padStart(2, '0')}`;

    // 1. Escuchar Viajes (Solo del mes seleccionado) y Configuración
    useEffect(() => {
        // Query optimizada: Solo trae los del rango de fechas actual
        const q = query(
            collection(db, "shifts"),
            where("date", ">=", startOfMonth),
            where("date", "<=", endOfMonth),
            orderBy("date", "desc")
        );

        const unsubShifts = onSnapshot(q, (snap) => {
            setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listen to Month specific config
        const unsubConfig = onSnapshot(doc(db, "configs", configId), (snap) => {
            if (snap.exists()) {
                setMonthlyConfig(snap.data());
            } else {
                // Default config for new months
                setMonthlyConfig({
                    budget: 0, offDays: [], highDemandDays: [], vacationStart: '', vacationEnd: ''
                });
            }
        });

        return () => { unsubShifts(); unsubConfig(); };
    }, [year, month, startOfMonth, endOfMonth, configId]); // Se vuelve a ejecutar si cambia el mes/año seleccionado

    // 2. Cálculos Inteligentes (Días, Pesos y Metas)
    const stats = useMemo(() => {
        const totalEarnings = shifts.reduce((acc, curr) => acc + (Number(curr.earnings) || 0), 0);
        const totalHours = shifts.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);
        const totalKm = shifts.reduce((acc, curr) => acc + (Number(curr.km) || 0), 0);
        const lastDay = new Date(year, month + 1, 0).getDate();

        let totalWeight = 0;
        let workDaysCount = 0;

        for (let d = 1; d <= lastDay; d++) {
            const current = new Date(year, month, d);
            const dateStr = current.toISOString().split('T')[0];
            const dayOfWeek = current.getDay();

            // Descontar Vacaciones
            if (monthlyConfig.vacationStart && monthlyConfig.vacationEnd) {
                if (dateStr >= monthlyConfig.vacationStart && dateStr <= monthlyConfig.vacationEnd) continue;
            }
            // Descontar Francos
            if (monthlyConfig.offDays.includes(dayOfWeek)) continue;

            workDaysCount++;
            totalWeight += monthlyConfig.highDemandDays.includes(dayOfWeek) ? 2 : 1;
        }

        const unitValue = totalWeight > 0 ? monthlyConfig.budget / totalWeight : 0;

        return {
            totalEarnings,
            totalHours,
            totalKm,
            hourlyRate: totalHours > 0 ? (totalEarnings / totalHours).toFixed(0) : 0,
            kmRate: totalKm > 0 ? (totalEarnings / totalKm).toFixed(0) : 0,
            plan: {
                normalGoal: unitValue,
                highGoal: unitValue * 2,
                totalWorkDays: workDaysCount,
                currentProgress: monthlyConfig.budget > 0 ? (totalEarnings / monthlyConfig.budget) * 100 : 0
            }
        };
    }, [shifts, monthlyConfig, year, month]);

    return {
        shifts,
        monthlyConfig,
        stats,
        currentDate, // Exponemos la fecha actual para el UI
        actions: {
            addShift: (s) => addDoc(collection(db, "shifts"), { ...s, createdAt: new Date() }),
            deleteShift: (id) => deleteDoc(doc(db, "shifts", id)),
            updateConfig: (c) => setDoc(doc(db, "configs", configId), c), // Save to specific month config
            setMonth: (date) => setCurrentDate(date) // Permitir cambiar el mes visible
        }
    };
}