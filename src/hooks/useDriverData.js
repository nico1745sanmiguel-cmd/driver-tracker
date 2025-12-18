import { useState, useEffect } from 'react';
import { db } from '../lib/firebaseClient';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    setDoc,
    getDoc
} from 'firebase/firestore';

export function useDriverData() {
    // --- Shifts State ---
    const [shifts, setShifts] = useState([]);

    // --- Settings State ---
    const [monthlyConfig, setMonthlyConfig] = useState({
        budget: 0,
        offDays: [],
        highDemandDays: [],
        vacationStart: '',
        vacationEnd: ''
    });

    // Fetch Shifts (Real-time)
    useEffect(() => {
        // For now, simpler collection query without userId filter until Auth is fully set up
        // In next step we will secure this by user.uid
        const q = query(collection(db, "shifts"), orderBy("date", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedShifts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setShifts(loadedShifts);
        });

        return () => unsubscribe();
    }, []);

    // Fetch Config (Real-time)
    useEffect(() => {
        // Hardcoded config doc ID for now "global_config" or eventually user_config
        const docRef = doc(db, "configs", "default_config");

        // Create default if not exists logic could go here, or just listen
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setMonthlyConfig(docSnap.data());
            }
        });

        return () => unsubscribe();
    }, []);

    // --- Actions ---
    const addShift = async (shift) => {
        try {
            await addDoc(collection(db, "shifts"), {
                ...shift,
                createdAt: new Date()
            });
        } catch (e) {
            console.error("Error adding shift: ", e);
            throw e; // Propagate error to caller (ImportPage) so it can log it
        }
    };

    const deleteShift = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este registro?')) {
            try {
                await deleteDoc(doc(db, "shifts", id));
            } catch (e) {
                console.error("Error deleting: ", e);
            }
        }
    };

    const updateConfig = async (newConfig) => {
        try {
            await setDoc(doc(db, "configs", "default_config"), newConfig);
            // Optimistic update
            setMonthlyConfig(newConfig);
        } catch (e) {
            console.error("Error updating config: ", e);
        }
    };

    // --- Global Stats Calculations ---
    const totalEarnings = shifts.reduce((acc, curr) => acc + curr.earnings, 0);
    const totalHours = shifts.reduce((acc, curr) => acc + curr.hours, 0);
    const hourlyRate = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;

    // --- Plan Calculations ---
    const calculatePlan = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        let totalWeight = 0;
        let normalDaysCount = 0;
        let highDaysCount = 0;
        let workDaysCount = 0;

        for (let day = 1; day <= lastDay; day++) {
            const current = new Date(year, month, day);
            const dayOfWeek = current.getDay();

            // Check Vacation
            if (monthlyConfig.vacationStart && monthlyConfig.vacationEnd) {
                const start = new Date(monthlyConfig.vacationStart);
                const end = new Date(monthlyConfig.vacationEnd);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                if (current >= start && current <= end) continue;
            }

            // Check Rest
            if (monthlyConfig.offDays.includes(dayOfWeek)) continue;

            workDaysCount++;

            // Check High Demand
            if (monthlyConfig.highDemandDays.includes(dayOfWeek)) {
                totalWeight += 2;
                highDaysCount++;
            } else {
                totalWeight += 1;
                normalDaysCount++;
            }
        }

        const unitValue = totalWeight > 0 ? monthlyConfig.budget / totalWeight : 0;

        return {
            normalGoal: unitValue,
            highGoal: unitValue * 2,
            normalDays: normalDaysCount,
            highDays: highDaysCount,
            totalWorkDays: workDaysCount,
            currentProgress: monthlyConfig.budget > 0
                ? Math.min((totalEarnings / monthlyConfig.budget) * 100, 100)
                : 0
        };
    };

    return {
        shifts,
        monthlyConfig,
        stats: {
            totalEarnings,
            totalHours,
            hourlyRate,
            plan: calculatePlan()
        },
        actions: {
            addShift,
            deleteShift,
            updateConfig
        }
    };
}
