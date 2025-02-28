import { createClient } from "@libsql/client"; // Cliente para SQLite (Turso)

const db = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL, // url de la API de Turso
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN, // token de autenticación de la API de Turso
});

export { db };





