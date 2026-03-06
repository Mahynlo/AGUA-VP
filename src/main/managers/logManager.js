/**
 * LogManager — Sistema de logging persistente para Agua VP
 *
 * Responsabilidades:
 *  1. Capturar logs del servidor API y del proceso principal
 *  2. Mantener un ring buffer en memoria (últimos N mensajes) para consulta rápida
 *  3. Persistir a archivos rotativos en disco (max size / max files)
 *  4. Emitir logs en tiempo real al renderer vía IPC push
 *  5. Filtrar información sensible (tokens, passwords, keys)
 *
 * Niveles: info | warn | error | debug
 *
 * @module LogManager
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

// ── Configuración por defecto ─────────────────────────────────────────────────

const DEFAULTS = {
    maxBufferSize: 500,           // Mensajes en memoria (ring buffer)
    maxFileSize: 5 * 1024 * 1024, // 5 MB por archivo
    maxFiles: 3,                   // Máximo 3 archivos rotativos (15 MB total)
    logDir: 'logs',                // Subdirectorio dentro de userData
    logFileName: 'agua-vp.log',    // Nombre base del archivo
    enableConsole: true,           // También imprimir en console
    enableFile: true,              // Persistir a disco
    enableIpc: true,               // Emitir al renderer
    ipcChannel: 'system:log-entry' // Canal IPC de push
};

// ── Patrones sensibles a filtrar ──────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
    // JWT tokens (3 segmentos base64 separados por puntos)
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    // Hex strings largos (secrets, hashes) — 32+ chars
    /\b[0-9a-f]{32,}\b/gi,
    // Password fields en JSON
    /"(?:password|contraseña|contrasena|secret|token|key)":\s*"[^"]+"/gi,
    // Authorization headers
    /(?:Bearer|AppKey)\s+[A-Za-z0-9._-]+/gi
];

/**
 * Reemplaza información sensible en un mensaje de log
 */
function sanitize(message) {
    if (typeof message !== 'string') return message;
    let sanitized = message;
    for (const pattern of SENSITIVE_PATTERNS) {
        // Resetear lastIndex para RegExp globales
        pattern.lastIndex = 0;
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
}

// ── Clase LogManager ──────────────────────────────────────────────────────────

class LogManager {
    constructor(config = {}) {
        this.config = { ...DEFAULTS, ...config };

        // Ring buffer en memoria
        this.buffer = [];
        this.bufferIndex = 0;

        // Directorio de logs
        this.logDir = path.join(app.getPath('userData'), this.config.logDir);
        this.logFilePath = path.join(this.logDir, this.config.logFileName);

        // Estado
        this._initialized = false;
        this._currentFileSize = 0;

        // Estadísticas de sesión
        this.stats = {
            totalMessages: 0,
            byLevel: { info: 0, warn: 0, error: 0, debug: 0 },
            startedAt: new Date().toISOString(),
            errorsThisSession: 0
        };
    }

    /**
     * Inicializa el LogManager: crea directorio y mide archivo actual.
     * Debe llamarse una vez al arranque de la app.
     */
    init() {
        if (this._initialized) return;

        // Crear directorio de logs
        if (this.config.enableFile && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Medir tamaño del archivo actual (si existe)
        if (this.config.enableFile && fs.existsSync(this.logFilePath)) {
            this._currentFileSize = fs.statSync(this.logFilePath).size;
        }

        this._initialized = true;
        this.info('LogManager inicializado', 'system');
    }

    // ── API principal ─────────────────────────────────────────────────────────

    /**
     * Registra un mensaje con nivel y fuente.
     * @param {'info'|'warn'|'error'|'debug'} level
     * @param {string} message
     * @param {string} [source='app'] — Origen: 'api', 'system', 'update', 'backup', etc.
     */
    log(level, message, source = 'app') {
        if (!this._initialized) this.init();

        const entry = {
            id: ++this.stats.totalMessages,
            timestamp: new Date().toISOString(),
            level,
            source,
            message: sanitize(String(message))
        };

        // Estadísticas
        if (this.stats.byLevel[level] !== undefined) {
            this.stats.byLevel[level]++;
        }
        if (level === 'error') {
            this.stats.errorsThisSession++;
        }

        // Ring buffer
        this._addToBuffer(entry);

        // Console
        if (this.config.enableConsole) {
            this._writeConsole(entry);
        }

        // Archivo
        if (this.config.enableFile) {
            this._writeFile(entry);
        }

        // IPC push al renderer
        if (this.config.enableIpc) {
            this._pushToRenderer(entry);
        }
    }

    /** Convenience methods */
    info(message, source)  { this.log('info', message, source); }
    warn(message, source)  { this.log('warn', message, source); }
    error(message, source) { this.log('error', message, source); }
    debug(message, source) { this.log('debug', message, source); }

    // ── Consultas ─────────────────────────────────────────────────────────────

    /**
     * Obtiene logs del buffer en memoria.
     * @param {Object} [options]
     * @param {string} [options.level] — Filtrar por nivel
     * @param {string} [options.source] — Filtrar por fuente
     * @param {string} [options.search] — Buscar texto en mensaje
     * @param {number} [options.limit=100] — Máximo de resultados
     * @returns {Array} Array de log entries
     */
    getLogs(options = {}) {
        const { level, source, search, limit = 100 } = options;

        let results = [...this.buffer].filter(e => e !== null && e !== undefined);

        // Ordenar por timestamp descendente (más recientes primero)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (level) {
            results = results.filter(e => e.level === level);
        }
        if (source) {
            results = results.filter(e => e.source === source);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            results = results.filter(e => e.message.toLowerCase().includes(searchLower));
        }

        return results.slice(0, limit);
    }

    /**
     * Obtiene las estadísticas de la sesión actual.
     */
    getStats() {
        return {
            ...this.stats,
            bufferUsed: this.buffer.filter(Boolean).length,
            bufferCapacity: this.config.maxBufferSize,
            logFilePath: this.logFilePath,
            currentFileSize: this._currentFileSize
        };
    }

    /**
     * Lee logs históricos del archivo en disco.
     * @param {number} [lines=200] — Últimas N líneas
     * @returns {string[]} Array de líneas
     */
    readLogFile(lines = 200) {
        if (!fs.existsSync(this.logFilePath)) return [];

        try {
            const content = fs.readFileSync(this.logFilePath, 'utf-8');
            const allLines = content.split('\n').filter(Boolean);
            return allLines.slice(-lines);
        } catch (err) {
            console.error('[LogManager] Error al leer archivo de logs:', err.message);
            return [];
        }
    }

    /**
     * Limpia el buffer de memoria (no afecta archivos).
     */
    clearBuffer() {
        this.buffer = [];
        this.bufferIndex = 0;
        this.info('Buffer de logs limpiado', 'system');
    }

    // ── Internos ──────────────────────────────────────────────────────────────

    _addToBuffer(entry) {
        if (this.buffer.length < this.config.maxBufferSize) {
            this.buffer.push(entry);
        } else {
            // Sobreescribir la entrada más antigua (ring buffer)
            this.buffer[this.bufferIndex] = entry;
            this.bufferIndex = (this.bufferIndex + 1) % this.config.maxBufferSize;
        }
    }

    _writeConsole(entry) {
        const prefix = `[${entry.source}]`;
        switch (entry.level) {
            case 'error': console.error(prefix, entry.message); break;
            case 'warn':  console.warn(prefix, entry.message); break;
            case 'debug': console.debug(prefix, entry.message); break;
            default:      console.log(prefix, entry.message); break;
        }
    }

    _writeFile(entry) {
        try {
            const line = `${entry.timestamp} [${entry.level.toUpperCase().padEnd(5)}] [${entry.source}] ${entry.message}\n`;
            const lineBytes = Buffer.byteLength(line, 'utf-8');

            // Rotar si excede el tamaño máximo
            if (this._currentFileSize + lineBytes > this.config.maxFileSize) {
                this._rotateFiles();
            }

            fs.appendFileSync(this.logFilePath, line, 'utf-8');
            this._currentFileSize += lineBytes;
        } catch (err) {
            // No llamar a this.error() para evitar recursión infinita
            console.error('[LogManager] Error escribiendo log:', err.message);
        }
    }

    _rotateFiles() {
        try {
            // Eliminar el archivo más antiguo
            const maxIdx = this.config.maxFiles - 1;
            const oldest = `${this.logFilePath}.${maxIdx}`;
            if (fs.existsSync(oldest)) {
                fs.unlinkSync(oldest);
            }

            // Rotar archivos: .2 → .3, .1 → .2, actual → .1
            for (let i = maxIdx - 1; i >= 1; i--) {
                const from = `${this.logFilePath}.${i}`;
                const to = `${this.logFilePath}.${i + 1}`;
                if (fs.existsSync(from)) {
                    fs.renameSync(from, to);
                }
            }

            // Archivo actual → .1
            if (fs.existsSync(this.logFilePath)) {
                fs.renameSync(this.logFilePath, `${this.logFilePath}.1`);
            }

            this._currentFileSize = 0;
        } catch (err) {
            console.error('[LogManager] Error en rotación:', err.message);
        }
    }

    _pushToRenderer(entry) {
        try {
            const windows = BrowserWindow.getAllWindows();
            for (const win of windows) {
                if (!win.isDestroyed() && win.webContents) {
                    win.webContents.send(this.config.ipcChannel, entry);
                }
            }
        } catch {
            // Silenciar — ventana puede no existir aún durante arranque
        }
    }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

const logManager = new LogManager();

export default logManager;
export { LogManager };
