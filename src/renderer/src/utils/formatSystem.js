/**
 * formatSystem.js — Utilidades de formato compartidas para los paneles de sistema
 */

export const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Alias con decimales .1 para velocidades de descarga
export const formatBytes = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};

// Para timestamps que pueden venir en segundos (Drizzle) o milisegundos
export const formatDateFromTimestamp = (ts) => {
  if (!ts) return "—";
  const num = Number(ts);
  const date = num > 1e12 ? new Date(num) : new Date(num * 1000);
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

export const formatUptime = (seconds) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};
