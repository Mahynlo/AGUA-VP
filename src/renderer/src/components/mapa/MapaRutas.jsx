import { useMemo, useCallback, useState } from "react";
import { Polyline, Popup, CircleMarker, Tooltip, useMapEvents } from "react-leaflet";
import { LatLng } from "leaflet";
import MapaBase from "./MapaBase";
import FichaMedidor, { FilaFicha, LeyendaMapa } from "./FichaMedidor";
import { COLORES_PUNTO, COLOR_RUTA, COLOR_CONEXION, ZOOM_NUMEROS, estiloPunto, coordenadas } from "./mapConfig";

// Solo avisa cuando se cruza el umbral de zoom (no en cada paso de la rueda del ratón)
const ZoomThresholdHandler = ({ isZoomedIn, onThresholdChange }) => {
  useMapEvents({
    zoomend: (e) => {
      const isCurrentlyZoomedIn = e.target.getZoom() >= ZOOM_NUMEROS;
      if (isZoomedIn !== isCurrentlyZoomedIn) onThresholdChange(isCurrentlyZoomedIn);
    },
  });
  return null;
};

// Punto más cercano de la ruta calculada a un punto dado (para dibujar la conexión con el camino)
const getClosestPoint = (punto, ruta) => {
  if (!ruta || ruta.length < 2) return { closest: null, distance: Infinity };

  const pLatLng = new LatLng(punto[0], punto[1]);
  const [py, px] = punto;
  let minDist = Infinity;
  let closest = null;

  for (let i = 0; i < ruta.length - 1; i++) {
    const [ay, ax] = ruta[i];
    const [by, bx] = ruta[i + 1];
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab_ab = abx * abx + aby * aby;
    const t = ab_ab === 0 ? 0 : Math.max(0, Math.min(1, (abx * apx + aby * apy) / ab_ab));
    const candidato = [ay + aby * t, ax + abx * t];
    const dist = pLatLng.distanceTo(new LatLng(candidato[0], candidato[1]));
    if (dist < minDist) {
      minDist = dist;
      closest = candidato;
    }
  }

  return { closest, distance: minDist };
};

const formatoNumero = (valor) => (valor === null || valor === undefined ? "—" : Number(valor).toLocaleString("es-MX"));

/**
 * Mapa de una ruta de lectura: camino calculado, puntos numerados en orden y medidores disponibles.
 *
 * @param {object[]} medidores    medidores con datos completos (cliente, predio, ubicación…)
 * @param {object[]} puntosRuta   puntos de la ruta en orden: { id, lat, lng, numero_serie, ... }
 * @param {boolean} [mostrarEstado] colorea los puntos por lectura del período (verde leído, naranja pendiente)
 *                                  usando `tiene_lectura`, `lectura_actual` y `consumo_m3` del medidor
 */
export default function MapaRutas({
  medidores = [],
  puntosRuta = [],
  rutaCalculada,
  dibujar,
  onAgregarMedidor,
  onEliminarMedidor,
  readOnly = false,
  mostrarEstado = false,
}) {
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // Búsqueda O(1) de los datos completos de cada punto
  const medidoresDict = useMemo(() => {
    const dict = new Map();
    for (const m of medidores) dict.set(m.id, m);
    return dict;
  }, [medidores]);

  const medidoresEnRutaIds = useMemo(() => new Set(puntosRuta.map((p) => p.id)), [puntosRuta]);

  const disponibles = useMemo(
    () =>
      medidores
        .filter((m) => !medidoresEnRutaIds.has(m.id))
        .map((m) => ({ medidor: m, coords: coordenadas(m.latitud, m.longitud) }))
        .filter((d) => d.coords),
    [medidores, medidoresEnRutaIds]
  );

  const puntos = useMemo(
    () =>
      puntosRuta
        .map((p, i) => {
          const medidor = { ...p, ...(medidoresDict.get(p.id) || {}) };
          const leido = mostrarEstado && Boolean(medidor.tiene_lectura || medidor.lectura_id);
          return { p, i, medidor, leido, coords: coordenadas(p.lat, p.lng) };
        })
        .filter((d) => d.coords),
    [puntosRuta, medidoresDict, mostrarEstado]
  );

  const leidos = useMemo(() => puntos.filter((d) => d.leido).length, [puntos]);

  // Encuadre al abrir: la ruta si ya tiene puntos; si no, todos los medidores
  const limites = useMemo(() => {
    if (puntos.length) return puntos.map((d) => d.coords);
    return disponibles.map((d) => d.coords);
  }, [puntos, disponibles]);

  const inicio = puntosRuta[0];
  const fin = puntosRuta[puntosRuta.length - 1];

  const conexionesExtremos = useMemo(() => {
    const conexiones = [];
    if (!readOnly && dibujar && rutaCalculada?.ruta?.length >= 2) {
      for (const [key, punto] of [["conex-inicio", inicio], ["conex-fin", fin]]) {
        if (!punto) continue;
        const { closest, distance } = getClosestPoint([punto.lat, punto.lng], rutaCalculada.ruta);
        if (distance > 5) conexiones.push({ key, from: [punto.lat, punto.lng], to: closest });
      }
    }
    return conexiones;
  }, [inicio, fin, rutaCalculada, dibujar, readOnly]);

  const conexionesIntermedias = useMemo(() => {
    const conexiones = [];
    if (!readOnly && dibujar && rutaCalculada?.puntos_gps?.length > 0 && rutaCalculada?.ruta?.length >= 2) {
      rutaCalculada.puntos_gps.forEach((punto, idx) => {
        const { closest, distance } = getClosestPoint(punto, rutaCalculada.ruta);
        if (distance > 5) conexiones.push({ key: `conex-${idx}`, from: punto, to: closest });
      });
    }
    return conexiones;
  }, [rutaCalculada, dibujar, readOnly]);

  const rutaPolyline = useMemo(() => {
    if (!dibujar || !rutaCalculada?.ruta?.length) return null;
    return rutaCalculada.ruta.map(([lat, lng]) => [lat, lng]);
  }, [rutaCalculada, dibujar]);

  const handleToggleMedidor = useCallback((medidor, enRuta) => {
    if (enRuta) {
      const index = puntosRuta.findIndex((p) => p.id === medidor.id);
      if (index !== -1) onEliminarMedidor?.(index);
    } else {
      onAgregarMedidor?.({ id: medidor.id, lat: medidor.latitud, lng: medidor.longitud, numero_serie: medidor.numero_serie });
    }
  }, [puntosRuta, onAgregarMedidor, onEliminarMedidor]);

  // Medidores fuera de la ruta (canvas: un solo elemento para todos, no un <img> por medidor)
  const marcadoresDisponibles = useMemo(() => disponibles.map(({ medidor, coords }) => (
    <CircleMarker key={`disp-${medidor.id}`} center={coords} radius={6} pathOptions={estiloPunto(COLORES_PUNTO.disponible)}>
      <Popup className="custom-popup" closeButton={false} autoPanPadding={[40, 40]}>
        <FichaMedidor
          serie={medidor.numero_serie}
          color={COLORES_PUNTO.disponible}
          estado={{ texto: "Fuera de la ruta", tono: "gris" }}
          cliente={medidor.cliente_nombre}
          predio={medidor.numero_predio}
          direccion={medidor.ubicacion}
          coords={coords}
        >
          {!readOnly && (
            <button
              onClick={() => handleToggleMedidor(medidor, false)}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
            >
              ➕ Agregar a ruta
            </button>
          )}
        </FichaMedidor>
      </Popup>
    </CircleMarker>
  )), [disponibles, readOnly, handleToggleMedidor]);

  const marcadoresRuta = useMemo(() => puntos.map(({ p, i, medidor, leido, coords }) => {
    const color = leido ? COLORES_PUNTO.leido : COLORES_PUNTO.pendiente;
    const estado = mostrarEstado
      ? (leido ? { texto: "Leído", tono: "verde" } : { texto: "Pendiente", tono: "naranja" })
      : { texto: "En la ruta", tono: "naranja" };

    return (
      <CircleMarker
        key={`punto-${p.id ?? i}`}
        center={coords}
        radius={isZoomedIn ? 11 : 7}
        pathOptions={estiloPunto(color, isZoomedIn)}
      >
        {isZoomedIn && (
          <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="aguavp-numero">
            {i + 1}
          </Tooltip>
        )}
        <Popup className="custom-popup" closeButton={false} autoPanPadding={[40, 40]}>
          <FichaMedidor
            serie={medidor.numero_serie}
            color={color}
            orden={i + 1}
            estado={estado}
            cliente={medidor.cliente_nombre}
            predio={medidor.numero_predio || medidor.cliente_numero_predio}
            direccion={medidor.cliente_direccion || medidor.ubicacion}
            coords={coords}
            detalle={leido ? (
              <div className="space-y-1 pt-1">
                <FilaFicha etiqueta="Lectura" valor={formatoNumero(medidor.lectura_actual)} />
                <FilaFicha etiqueta="Consumo" valor={`${formatoNumero(medidor.consumo_m3)} m³`} />
              </div>
            ) : null}
          >
            {!readOnly && (
              <button
                onClick={() => handleToggleMedidor(medidor, true)}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600"
              >
                🗑 Quitar de ruta
              </button>
            )}
          </FichaMedidor>
        </Popup>
      </CircleMarker>
    );
  }), [puntos, isZoomedIn, mostrarEstado, readOnly, handleToggleMedidor]);

  const leyenda = mostrarEstado
    ? [
        { color: COLORES_PUNTO.leido, texto: "Leídos", cantidad: leidos },
        { color: COLORES_PUNTO.pendiente, texto: "Pendientes", cantidad: puntos.length - leidos },
      ]
    : [
        { color: COLORES_PUNTO.pendiente, texto: "En la ruta", cantidad: puntos.length },
        ...(disponibles.length ? [{ color: COLORES_PUNTO.disponible, texto: "Fuera de la ruta", cantidad: disponibles.length }] : []),
      ];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-neutral-800">
      <MapaBase
        limites={limites}
        superpuesto={
          <LeyendaMapa
            titulo={mostrarEstado && puntos.length ? `Avance: ${leidos} de ${puntos.length}` : undefined}
            items={leyenda}
          />
        }
      >
        <ZoomThresholdHandler isZoomedIn={isZoomedIn} onThresholdChange={setIsZoomedIn} />

        {rutaPolyline && rutaPolyline.length >= 2 && (
          <Polyline positions={rutaPolyline} pathOptions={{ color: COLOR_RUTA, weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
        )}
        {conexionesExtremos.map(({ key, from, to }) => (
          <Polyline key={key} positions={[from, to]} pathOptions={{ color: COLOR_CONEXION, dashArray: "8, 8", weight: 3, opacity: 0.8 }} />
        ))}
        {conexionesIntermedias.map(({ key, from, to }) => (
          <Polyline key={key} positions={[from, to]} pathOptions={{ color: COLOR_CONEXION, dashArray: "4, 8", weight: 2, opacity: 0.6 }} />
        ))}

        {marcadoresDisponibles}
        {marcadoresRuta}
      </MapaBase>
    </div>
  );
}
