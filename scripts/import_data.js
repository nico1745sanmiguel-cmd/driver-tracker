import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

// --- PASO 1: PEGA TU CONFIGURACIÓN AQUÍ ---
const firebaseConfig = {
    apiKey: "AIzaSyBFHFRG0IMLg3zSKpPPq1uxL7PJ3B85c90",
    authDomain: "driver-tracker-77d9a.firebaseapp.com",
    projectId: "driver-tracker-77d9a",
    storageBucket: "driver-tracker-77d9a.firebasestorage.app",
    messagingSenderId: "545227605228",
    appId: "1:545227605228:web:de010845017f1e1a4cd1c9"
};
// --- FIN CONFIGURACIÓN ---

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para limpiar números
function parseLatinNumber(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

// Helper para fecha con Relleno de Ceros (Paddding)
function parseLatinDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // Limpieza agresiva: quitar espacios y convertir / a -
    let normalized = dateStr.trim().replace(/\//g, '-');
    normalized = normalized.replace(/[^0-9-]/g, '');

    const parts = normalized.split('-');
    if (parts.length !== 3) return null;

    let year, month, day;

    // Caso 1: YYYY-MM-DD (Año al principio)
    if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
    }
    // Caso 2: DD-MM-YYYY (Año al final)
    else if (parts[2].length === 4) {
        day = parts[0];
        month = parts[1];
        year = parts[2];
    } else {
        // Fallback inseguro, asumimos DD-MM-YY -> 20YY
        day = parts[0];
        month = parts[1];
        year = '20' + parts[2];
    }

    // Asegurar 2 dígitos (01, 05, 10...)
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

async function importData() {
    console.log("🚀 Iniciando proceso de importación (Modo ISO-8601 Corregido)...");

    try {
        const dataPath = path.join(__dirname, "data.json");
        const rawData = await fs.readFile(dataPath, "utf-8");
        const rows = JSON.parse(rawData);

        if (!Array.isArray(rows)) {
            throw new Error("El archivo data.json debe ser una lista [].");
        }

        console.log(`📄 Leyendo ${rows.length} días de trabajo...`);

        let shiftsToUpload = [];

        rows.forEach(row => {
            const dateStr = parseLatinDate(row.date);

            if (!dateStr) {
                console.warn(`⚠️ Fecha inválida saltada: "${row.date}"`);
                return;
            }

            const totalHours = parseLatinNumber(row.Hours);
            const totalKm = parseLatinNumber(row.Km);

            const platforms = [
                { name: 'Uber', val: parseLatinNumber(row.Uber) },
                { name: 'Didi', val: parseLatinNumber(row.Didi) },
                { name: 'Otros', val: parseLatinNumber(row.Otros) }
            ];

            const activePlatforms = platforms.filter(p => p.val > 0);

            // 1. Ganancias
            activePlatforms.forEach(p => {
                shiftsToUpload.push({
                    date: dateStr,
                    platform: p.name,
                    earnings: p.val,
                    hours: 0,
                    km: 0,
                    createdAt: new Date(),
                    type: 'income'
                });
            });

            // 2. Stats Diarias
            if (totalHours > 0 || totalKm > 0) {
                shiftsToUpload.push({
                    date: dateStr,
                    platform: 'Reporte Diario',
                    earnings: 0,
                    hours: totalHours,
                    km: totalKm,
                    createdAt: new Date(),
                    type: 'stats'
                });
            } else if (activePlatforms.length === 0) {
                console.log(`ℹ️ Saltando día vacío: ${dateStr}`);
            }
        });

        console.log(`🔄 Transformado: ${rows.length} días -> ${shiftsToUpload.length} registros individuales.`);

        const BATCH_SIZE = 500;
        let batchCount = 0;
        let processedCount = 0;

        for (let i = 0; i < shiftsToUpload.length; i += BATCH_SIZE) {
            const chunk = shiftsToUpload.slice(i, i + BATCH_SIZE);
            const batch = writeBatch(db);

            chunk.forEach((shift) => {
                const newDocRef = doc(collection(db, "shifts"));
                batch.set(newDocRef, shift);
            });

            await batch.commit();
            processedCount += chunk.length;
            batchCount++;
            console.log(`✅ Lote ${batchCount} subido (${processedCount}/${shiftsToUpload.length} registros)`);
        }

        console.log("\n🎉 IMPORTACIÓN COMPLETADA");
        console.log("Fechas corregidas a formato estricto ISO (YYYY-MM-DD).");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        process.exit(1);
    }
}

importData();
