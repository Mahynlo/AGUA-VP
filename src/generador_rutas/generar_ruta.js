const { calcularRuta } = require('ruta-craft-osm');
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

    // El motor lee y actualiza el caché de tramos directamente en userData
    const resultado = await calcularRuta({
        puntos: puntos_validos,
        cachePath: rutaCache
    });

    return resultado.resultado;
};

