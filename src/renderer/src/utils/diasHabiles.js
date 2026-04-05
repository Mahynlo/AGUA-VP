/**
 * Días Hábiles y Feriados Mexicanos
 * Utilidad frontend para el calendario
 * 
 * Feriados oficiales según Ley Federal del Trabajo Art. 74
 */

/**
 * Obtiene el N-ésimo lunes de un mes dado
 */
function obtenerNesimoLunes(anio, mes, n) {
    let fecha = new Date(anio, mes, 1);
    let contadorLunes = 0;
    while (contadorLunes < n) {
        if (fecha.getDay() === 1) contadorLunes++;
        if (contadorLunes < n) fecha.setDate(fecha.getDate() + 1);
    }
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mm}-${dd}`;
}

/**
 * Obtiene los feriados oficiales de México para un año dado.
 * @param {number} anio
 * @returns {{ fecha: string, nombre: string }[]}
 */
function obtenerFeriadosAdicionales(anio) {
    const raw = import.meta?.env?.VITE_FERIADOS_ADICIONALES;
    if (!raw || typeof raw !== 'string') return [];

    return raw
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => {
            const [fechaRaw, nombreRaw] = item.split('|');
            const fecha = (fechaRaw || '').trim();
            const nombre = (nombreRaw || 'Fecha importante').trim();

            if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
            if (Number(fecha.substring(0, 4)) !== anio) return null;

            return { fecha, nombre };
        })
        .filter(Boolean);
}

export function obtenerFeriadosMexico(anio) {
    const feriados = [
        { fecha: `${anio}-01-01`, nombre: 'Año Nuevo' },
        { fecha: `${anio}-05-01`, nombre: 'Día del Trabajo' },
        { fecha: `${anio}-09-16`, nombre: 'Independencia de México' },
        { fecha: `${anio}-12-25`, nombre: 'Navidad' },
        // Puentes (lunes más cercano)
        { fecha: obtenerNesimoLunes(anio, 1, 1), nombre: 'Día de la Constitución' },
        { fecha: obtenerNesimoLunes(anio, 2, 3), nombre: 'Natalicio de Benito Juárez' },
        { fecha: obtenerNesimoLunes(anio, 10, 3), nombre: 'Día de la Revolución' },
    ];

    // Transmisión del Poder Ejecutivo (cada 6 años)
    if (anio >= 2024 && (anio - 2024) % 6 === 0) {
        feriados.push({ fecha: `${anio}-10-01`, nombre: 'Transmisión del Poder Ejecutivo' });
    }

    const feriadosAdicionales = obtenerFeriadosAdicionales(anio);
    const fechasExistentes = new Set(feriados.map(f => f.fecha));
    feriadosAdicionales.forEach((f) => {
        if (!fechasExistentes.has(f.fecha)) {
            feriados.push(f);
            fechasExistentes.add(f.fecha);
        }
    });

    return feriados;
}

/**
 * Verifica si una fecha es feriado
 * @param {string} fechaStr - Formato 'YYYY-MM-DD'
 * @param {number} anio
 * @returns {string|null} Nombre del feriado o null
 */
export function esFeriado(fechaStr, anio) {
    const feriados = obtenerFeriadosMexico(anio);
    const found = feriados.find(f => f.fecha === fechaStr);
    return found ? found.nombre : null;
}

/**
 * Verifica si una fecha es día hábil
 * @param {Date} fecha
 * @returns {boolean}
 */
export function esDiaHabil(fecha) {
    const dia = fecha.getDay();
    if (dia === 0 || dia === 6) return false;
    const anio = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return !esFeriado(`${anio}-${mm}-${dd}`, anio);
}

/**
 * Avanza la fecha hasta el siguiente día hábil (inclusive: si ya es hábil, la devuelve).
 * @param {Date} fecha
 * @returns {Date}
 */
export function siguienteDiaHabil(fecha) {
    const d = new Date(fecha);
    while (!esDiaHabil(d)) {
        d.setDate(d.getDate() + 1);
    }
    return d;
}

/**
 * Devuelve la fecha actual en zona horaria de Hermosillo como string 'YYYY-MM-DD'.
 * Usa la API nativa Intl para evitar dependencias adicionales.
 * @returns {string}
 */
export function nowHermosilloDateStr() {
    // 'sv' (Swedish) locale produce el formato ISO YYYY-MM-DD de forma nativa
    return new Date().toLocaleDateString('sv', { timeZone: 'America/Hermosillo' });
}
