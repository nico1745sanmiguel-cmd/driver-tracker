import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebaseClient';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';

export function useDriverData() {
    const [shifts, setShifts] = useState([]);
    const [monthlyConfig, setMonthlyConfig] = useState({
        budget: 0, offDays: [], highDemandDays: [], vacationStart: '', vacationEnd: ''
    });

    // 1. Escuchar Viajes y Configuración
    useEffect(() => {
        const q = query(collection(db, "shifts"), orderBy("date", "desc"));
        const unsubShifts = onSnapshot(q, (snap) => {
            setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubConfig = onSnapshot(doc(db, "configs", "default_config"), (snap) => {
            if (snap.exists()) setMonthlyConfig(snap.data());
        });
        return () => { unsubShifts(); unsubConfig(); };
    }, []);

    // 2. Cálculos Inteligentes (Días, Pesos y Metas)
    const stats = useMemo(() => {
        const totalEarnings = shifts.reduce((acc, curr) => acc + (Number(curr.earnings) || 0), 0);
        const totalHours = shifts.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
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
            hourlyRate: totalHours > 0 ? (totalEarnings / totalHours).toFixed(0) : 0,
            plan: {
                normalGoal: unitValue,
                highGoal: unitValue * 2,
                totalWorkDays: workDaysCount,
                currentProgress: monthlyConfig.budget > 0 ? (totalEarnings / monthlyConfig.budget) * 100 : 0
            }
        };
    }, [shifts, monthlyConfig]);

    return {
        shifts, monthlyConfig, stats,
        actions: {
            addShift: (s) => addDoc(collection(db, "shifts"), { ...s, createdAt: new Date() }),
            deleteShift: (id) => deleteDoc(doc(db, "shifts", id)),
            updateConfig: (c) => setDoc(doc(db, "configs", "default_config"), c)
        }
    };
}