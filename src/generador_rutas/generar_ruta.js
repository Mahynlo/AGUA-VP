const { calcularRuta } = require('ruta-craft-osm');
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const rutaCache = path.join(app.getPath("userData"), "cache_rutas.json");

export const GenerarRutaLectura = async (puntos_gps) => {
    if (!Array.isArray(puntos_gps) || puntos_gps.length < 2) {
        throw new Error("Se requieren al menos dos puntos GPS para generar una ruta");
    }

    const puntos_validos = puntos_gps.map(punto => {
        if (
            typeof punto.lat !== 'number' ||
            typeof punto.lng !== 'number' ||
            Number.isNaN(punto.lat) ||
            Number.isNaN(punto.lng)
        ) {
            throw new Error("Cada punto GPS debe tener propiedades 'lat' y 'lng' numéricas válidas");
        }
        return [punto.lat, punto.lng];
    });

    // Leer cache si existe
    const usarCache = fs.existsSync(rutaCache)
        ? JSON.parse(fs.readFileSync(rutaCache, 'utf-8'))
        : undefined;

    const resultado = await calcularRuta({
        puntos: puntos_validos,
        cache: usarCache // ← Asumiendo que `calcularRuta` acepta el cache así
    });

    // Guardar el nuevo cache si viene en el resultado
    if (resultado?.cache) {
        fs.writeFileSync(rutaCache, JSON.stringify(resultado.cache, null, 2));
    }

    return resultado.resultado; // o return resultado si así lo necesitas
};

