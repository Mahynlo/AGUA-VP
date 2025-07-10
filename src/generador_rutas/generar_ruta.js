const { calcularRuta } = require('ruta-craft-osm');

export const GenerarRutaLectura = async (puntos_gps) => {
    //console.log("📌 Puntos GPS recibidos:", puntos_gps);

    if (!Array.isArray(puntos_gps) || puntos_gps.length < 2) {
        throw new Error("Se requieren al menos dos puntos GPS para generar una ruta");
    }

    //console.log("📍 Puntos GPS válidos desde funcion(exe):", puntos_gps);

    

    // Validar cada punto
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

    // Finalmente calcular la ruta
    const resultado = await calcularRuta({
        puntos: puntos_validos,
        grafo: "grafos/grafo_mazatan_villapesqueira.pkl",
    });

    return resultado;
};
