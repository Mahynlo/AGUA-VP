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
