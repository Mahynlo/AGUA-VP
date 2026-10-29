import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, useMapEvents } from "react-leaflet";
import { HiArrowsExpand } from "react-icons/hi";
import "leaflet/dist/leaflet.css";
import "./mapa.css";
import municipiojson from "../../../../public/VillaPesqueira.json";
import {
  MAP_DEFAULT_CENTER,
  TILE_LAYER,
  SATELLITE_LAYER,
  HYBRID_LAYER,
  MUNICIPIO_STYLE,
  MUNICIPIO_STYLE_NO_FILL,
} from "./mapConfig";
import OfflineTileLayer from "./OfflineTileLayer";

const PADDING_AJUSTE = [40, 40];

// Recalcula el tamaño del mapa cuando cambia su contenedor (modales que se abren con animación,
// paneles que cambian de alto). Sin esto Leaflet deja zonas grises sin cargar.
const AjustarTamano = () => {
  const map = useMap();
  useEffect(() => {
    let frame = null;
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize());
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [map]);
  return null;
};

// Mueve la vista: al cambiar `centro` (conserva el zoom actual, o usa `zoomCentro` si se indica)
// y, la primera vez que hay `limites`, encuadra todos los puntos.
const ControlVista = ({ centro, zoomCentro, limites, onMapa }) => {
  const map = useMap();
  const yaAjustado = useRef(false);
  const claveCentro = centro ? `${centro[0]},${centro[1]}` : "";

  useEffect(() => {
    onMapa?.(map);
  }, [map, onMapa]);

  useEffect(() => {
    if (!centro) return;
    map.setView(centro, zoomCentro ?? map.getZoom(), { animate: false });
  }, [claveCentro, zoomCentro, map]);

  useEffect(() => {
    if (yaAjustado.current || !limites?.length) return;
    yaAjustado.current = true;
    if (limites.length === 1) map.setView(limites[0], 17, { animate: false });
    else map.fitBounds(limites, { padding: PADDING_AJUSTE, maxZoom: 18, animate: false });
  }, [limites, map]);

  return null;
};

const ClickEnMapa = ({ onClick }) => {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
};

/**
 * Mapa común de AguaVP: capas (calles con caché sin conexión, satélite, híbrido), límite del
 * municipio, controles con el mismo estilo y ajuste de tamaño/vista. Los puntos van como children.
 *
 * @param {[number, number]} [centro]   centro inicial; si cambia, el mapa se mueve ahí
 * @param {number} [zoom]               zoom inicial
 * @param {number} [zoomCentro]         zoom al moverse a un nuevo `centro` (por defecto, el actual)
 * @param {[number, number][]} [limites] puntos a encuadrar al abrir; muestra el botón «Ver todo»
 * @param {boolean} [rellenoMunicipio]  relleno sutil del municipio (false en el selector de coordenadas)
 * @param {(latlng) => void} [onClick]  clic en el mapa
 * @param {React.ReactNode} [superpuesto] tarjetas o leyendas encima del mapa (fuera del canvas)
 */
export default function MapaBase({
  centro,
  zoom = 15,
  zoomCentro,
  limites,
  rellenoMunicipio = true,
  onClick,
  superpuesto,
  className = "",
  children,
}) {
  const [mapa, setMapa] = useState(null);

  const verTodo = () => {
    if (!mapa || !limites?.length) return;
    if (limites.length === 1) mapa.setView(limites[0], 17);
    else mapa.fitBounds(limites, { padding: PADDING_AJUSTE, maxZoom: 18 });
  };

  return (
    <div className={`relative h-full w-full overflow-hidden isolate ${className}`}>
      <MapContainer
        center={centro || MAP_DEFAULT_CENTER}
        zoom={zoom}
        scrollWheelZoom={true}
        preferCanvas={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <AjustarTamano />
        <ControlVista centro={centro} zoomCentro={zoomCentro} limites={limites} onMapa={setMapa} />
        {onClick && <ClickEnMapa onClick={onClick} />}

        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="🌐 Mapa Calles">
            <OfflineTileLayer {...TILE_LAYER} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="🛰️ Satélite">
            <TileLayer {...SATELLITE_LAYER} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="🗺️ Híbrido">
            <TileLayer {...HYBRID_LAYER} />
          </LayersControl.BaseLayer>
        </LayersControl>

        <GeoJSON
          data={municipiojson}
          style={rellenoMunicipio ? MUNICIPIO_STYLE : MUNICIPIO_STYLE_NO_FILL}
          interactive={false}
        />

        {children}
      </MapContainer>

      {limites?.length > 1 && (
        <button
          type="button"
          onClick={verTodo}
          title="Encuadrar todos los puntos"
          className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700"
        >
          <HiArrowsExpand className="text-sm" />
          Ver todo
        </button>
      )}

      {superpuesto}
    </div>
  );
}
