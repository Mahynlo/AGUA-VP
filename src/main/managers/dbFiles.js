/**
 * dbFiles.js — Operaciones seguras sobre el archivo de la base de datos (sin dependencias de Electron).
 *
 * La base trabaja en modo WAL: los cambios recientes viven en `agua-vp.db-wal` hasta el checkpoint.
 * Por eso:
 *  - Un respaldo NO puede ser una copia del archivo principal (perdería lo que está en el WAL):
 *    se usa `VACUUM INTO`, que genera una copia consistente e íntegra aunque la base esté abierta.
 *  - Una restauración NO puede copiar un archivo encima de la base mientras la API la tiene abierta
 *    (el WAL de la conexión abierta se reaplicaría sobre el archivo nuevo). Se deja "preparada"
 *    (`agua-vp.db.restaurar`) y se aplica al siguiente arranque, antes de abrir la base.
 */

import fs from 'fs';
import Database from 'better-sqlite3';

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

/** Ruta del archivo de restauración pendiente para una base. */
export const pendingRestorePath = (dbPath) => `${dbPath}.restaurar`;

/**
 * Copia consistente de la base (incluye lo que está en el WAL) con VACUUM INTO.
 * @throws si la base no existe, el destino ya existe o SQLite falla.
 */
export function snapshotDatabase(dbPath, destPath) {
    if (fs.existsSync(destPath)) throw new Error(`El destino ya existe: ${destPath}`);
    const db = new Database(dbPath, { fileMustExist: true });
    try {
        db.exec(`VACUUM INTO ${sqlString(destPath)}`);
    } finally {
        db.close();
    }
    return destPath;
}

/** `PRAGMA integrity_check` de un archivo, sin modificarlo. */
export function checkFileIntegrity(file) {
    const db = new Database(file, { readonly: true, fileMustExist: true });
    try {
        return db.pragma('integrity_check')[0]?.integrity_check === 'ok';
    } finally {
        db.close();
    }
}

/**
 * Valida un archivo de base de datos y lo deja preparado para reemplazar la base al siguiente arranque.
 * @param {string} sourcePath - respaldo local o base restaurada desde la nube
 * @param {string} dbPath     - base en uso
 * @param {{ move?: boolean, requireFullSync?: boolean }} [options]
 *   move: mover en lugar de copiar (archivos temporales)
 *   requireFullSync: marcar la base para una carga completa protegida a la nube al volver a sincronizar
 *     (un respaldo local puede ser más antiguo que la nube: la carga completa compara y, si la nube tiene
 *     más datos, pide confirmación; si no, re-sube todo y corrige la copia)
 * @returns {string} ruta del archivo pendiente
 */
export function stageRestore(sourcePath, dbPath, { move = false, requireFullSync = false } = {}) {
    if (!fs.existsSync(sourcePath)) throw new Error('Archivo a restaurar no encontrado');
    if (!checkFileIntegrity(sourcePath)) throw new Error('El archivo a restaurar está dañado (integrity_check falló)');

    const pending = pendingRestorePath(dbPath);
    const tmp = `${pending}.tmp`;
    fs.rmSync(tmp, { force: true });
    if (move) fs.renameSync(sourcePath, tmp);
    else fs.copyFileSync(sourcePath, tmp);

    if (requireFullSync) {
        const db = new Database(tmp, { fileMustExist: true });
        try {
            const tieneEstado = db.prepare(`SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'sync_estado'`).get();
            if (tieneEstado) {
                db.prepare(`INSERT INTO sync_estado (clave, valor) VALUES ('requiere_carga_completa', '1')
                    ON CONFLICT(clave) DO UPDATE SET valor = '1'`).run();
            }
            db.pragma('journal_mode = DELETE'); // dejar un único archivo, sin -wal
        } finally {
            db.close();
        }
    }

    fs.renameSync(tmp, pending); // reemplazo atómico de una restauración pendiente anterior
    return pending;
}

/**
 * Aplica una restauración pendiente. Debe llamarse ANTES de que cualquier conexión abra la base.
 *  1. Verifica el archivo pendiente (si está dañado se descarta y la base actual queda intacta).
 *  2. Respalda la base actual con su WAL (`backupCurrent`); si el respaldo falla, NO se restaura.
 *  3. Reemplaza el archivo y elimina `-wal`/`-shm` de la base anterior.
 *
 * @param {string} dbPath
 * @param {(dbPath: string) => string|null} backupCurrent - crea el respaldo de seguridad y devuelve su ruta
 * @returns {null | { applied: boolean, backup?: string|null, error?: string }}
 */
export function applyPendingRestore(dbPath, backupCurrent) {
    const pending = pendingRestorePath(dbPath);
    if (!fs.existsSync(pending)) return null;

    if (!checkFileIntegrity(pending)) {
        fs.renameSync(pending, `${pending}.invalido`);
        return { applied: false, error: 'El archivo de restauración pendiente estaba dañado; se descartó y la base actual no se modificó.' };
    }

    let backup = null;
    if (fs.existsSync(dbPath)) {
        backup = backupCurrent(dbPath); // lanza si falla: mejor no restaurar que perder la base actual
        const previous = `${dbPath}.anterior`;
        fs.rmSync(previous, { force: true });
        fs.renameSync(dbPath, previous);
        fs.rmSync(`${dbPath}-wal`, { force: true });
        fs.rmSync(`${dbPath}-shm`, { force: true });
        fs.renameSync(pending, dbPath);
        fs.rmSync(previous, { force: true });
    } else {
        // Sin base principal: puede ser primera instalación o un corte de energía a mitad de un reemplazo
        // anterior (la base ya se había movido a `.anterior` y su respaldo ya existe). Un -wal/-shm que quede
        // es de la base anterior y se reaplicaría sobre el archivo nuevo: se elimina antes de colocarlo.
        fs.rmSync(`${dbPath}-wal`, { force: true });
        fs.rmSync(`${dbPath}-shm`, { force: true });
        fs.renameSync(pending, dbPath);
    }
    return { applied: true, backup };
}

/**
 * Elimina restos de restauraciones anteriores (llamar ANTES de abrir la base):
 *  - `<db>.anterior` cuando la base ya está en su lugar (queda si se cortó la energía al reemplazar)
 *  - `<db>.restaurar.tmp` (preparación interrumpida)
 *  - archivos de `restauraciones/` con más de un día (bases preparadas que no se aplicaron)
 * Los `*.restaurar.invalido` se conservan como evidencia.
 * @returns {string[]} archivos eliminados
 */
export function cleanupRestoreLeftovers(dbPath, restoreDir, ahora = Date.now()) {
    const eliminados = [];
    const borrar = (f) => {
        try {
            fs.rmSync(f, { force: true });
            eliminados.push(f);
        } catch (_) { /* en uso: se intentará en el siguiente arranque */ }
    };
    if (fs.existsSync(dbPath) && fs.existsSync(`${dbPath}.anterior`)) borrar(`${dbPath}.anterior`);
    if (fs.existsSync(`${pendingRestorePath(dbPath)}.tmp`)) borrar(`${pendingRestorePath(dbPath)}.tmp`);
    if (restoreDir && fs.existsSync(restoreDir)) {
        for (const f of fs.readdirSync(restoreDir)) {
            const full = `${restoreDir}/${f}`;
            if (ahora - fs.statSync(full).mtimeMs > 24 * 60 * 60 * 1000) borrar(full);
        }
    }
    return eliminados;
}

// ── Retención de respaldos ────────────────────────────────────────────────────

/** Motivos de respaldo que se guardan en el nombre del archivo. */
export const BACKUP_REASONS = ['pre-arranque', 'manual', 'pre-update', 'pre-restore'];
/** Respaldos previos a una operación riesgosa: se conservan aparte de la rotación general. */
export const PROTECTED_REASONS = ['pre-update', 'pre-restore'];

/** Motivo de un archivo `agua-vp-backup-<fecha>[-n]-<motivo>.db` (los nombres antiguos sin motivo → 'general'). */
export function backupReason(name) {
    const m = /-(pre-arranque|manual|pre-update|pre-restore)\.db$/.exec(name);
    return m ? m[1] : 'general';
}

/**
 * Decide qué respaldos eliminar (no borra nada).
 *  - Protegidos (`pre-restore`, `pre-update`): se conservan los `maxProtegidos` más recientes de cada motivo.
 *  - Generales (arranque, manual, antiguos): los `maxRecientes` más recientes + el más reciente de cada uno
 *    de los últimos `diasDiarios` días.
 * @param {{ name: string, mtimeMs: number }[]} files
 * @returns {string[]} nombres a eliminar
 */
export function planBackupRotation(files, { maxRecientes = 5, diasDiarios = 14, maxProtegidos = 10, ahora = Date.now() } = {}) {
    const dia = 24 * 60 * 60 * 1000;
    const porReciente = [...files].sort((a, b) => b.mtimeMs - a.mtimeMs);
    const conservar = new Set();

    for (const motivo of PROTECTED_REASONS) {
        porReciente.filter(f => backupReason(f.name) === motivo).slice(0, maxProtegidos).forEach(f => conservar.add(f.name));
    }

    const generales = porReciente.filter(f => !PROTECTED_REASONS.includes(backupReason(f.name)));
    generales.slice(0, maxRecientes).forEach(f => conservar.add(f.name));
    const diasVistos = new Set();
    for (const f of generales) {
        if (ahora - f.mtimeMs > diasDiarios * dia) continue;
        const clave = new Date(f.mtimeMs).toISOString().slice(0, 10);
        if (!diasVistos.has(clave)) {
            diasVistos.add(clave);
            conservar.add(f.name);
        }
    }

    return files.map(f => f.name).filter(n => !conservar.has(n));
}
