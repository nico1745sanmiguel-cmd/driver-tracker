function parseLatinDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // Normalizar separadores: cambiar / por -
    let normalized = dateStr.replace(/\//g, '-');

    const parts = normalized.split('-');
    if (parts.length !== 3) return null;

    console.log(`Debug: Processing '${dateStr}' -> Parts: [${parts}]`);

    // Caso 1: Ya viene como YYYY-MM-DD (Año al principio, 4 dígitos)
    if (parts[0].length === 4) {
        return normalized;
    }

    // Caso 2: Viene como DD-MM-YYYY (Año al final)
    // Lo invertimos a YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Test cases based on user report
const dates = [
    "2025-12-15",
    "15/12/2025",
    "10-12-2025",
    "10/12/2025"
];

dates.forEach(d => {
    console.log(`Input: ${d} => Output: ${parseLatinDate(d)}`);
});
