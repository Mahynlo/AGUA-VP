import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Marker } from "react-leaflet";
import { HiLocationMarker, HiGlobeAlt, HiMap } from "react-icons/hi";
import L from "leaflet";
import ubicacionIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import MapaBase from "./MapaBase";

/** [lat, lng] numérico o null si el texto todavía no es una coordenada válida */
const aPosicion = ({ lat, lng } = {}) => {
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  return !isNaN(la) && !isNaN(ln) ? [la, ln] : null;
};

const mismaPosicion = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

export default function SelectorCoordenadas({
  valorInicial = { lat: "29.1180777", lng: "-109.9669819" },
  onChange,
}) {
  const [coordenadas, setCoordenadas] = useState(valorInicial);
  // Centro del mapa: solo cambia al escribir en los campos o si las coordenadas llegan de fuera.
  // Al hacer clic o arrastrar el pin el mapa NO se mueve: el pin queda donde se eligió.
  const [centroMapa, setCentroMapa] = useState(() => aPosicion(valorInicial));
  const coordenadasRef = useRef(coordenadas);
  coordenadasRef.current = coordenadas;

  // Icono memoizado
  const customIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: ubicacionIcon,
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -30],
    });
  }, []);

  // Sincronizar con el valor del formulario solo si es otra ubicación: el padre devuelve en cada
  // render la misma que se acaba de elegir (y eso no debe mover el mapa ni pisar lo que se escribe)
  useEffect(() => {
    const nueva = aPosicion(valorInicial);
    const actual = aPosicion(coordenadasRef.current);
    if (!nueva || !actual || mismaPosicion(nueva, actual)) return;
    setCoordenadas(valorInicial);
    setCentroMapa(nueva);
  }, [valorInicial]);

  // Notificar al padre solo si son válidas
  useEffect(() => {
    const lat = parseFloat(coordenadas.lat);
    const lng = parseFloat(coordenadas.lng);
    if (!isNaN(lat) && !isNaN(lng) && onChange) {
      onChange({ lat, lng });
    }
  }, [coordenadas, onChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Permitir escribir sin bloquear signos negativos o puntos
    const nuevas = { ...coordenadas, [name]: value };
    setCoordenadas(nuevas);
    // Al escribir sí se mueve el mapa para ver el punto
    const posicion = aPosicion(nuevas);
    if (posicion) setCentroMapa(posicion);
  };

  // Calcular posición válida para el mapa
  const position = useMemo(() => aPosicion(coordenadas), [coordenadas]);

  // Clic en el mapa o pin arrastrado: captura la ubicación con 6 decimales sin mover el mapa
  const handleClickMapa = useCallback(({ lat, lng }) => {
    setCoordenadas({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
  }, []);

  const eventosPin = useMemo(() => ({
    dragend: (e) => handleClickMapa(e.target.getLatLng()),
  }), [handleClickMapa]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

      {/* Columna Izquierda: Mapa */}
      <div className="lg:col-span-2 h-[300px] lg:h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative z-0">
        <MapaBase centro={centroMapa} zoom={15} rellenoMunicipio={false} onClick={handleClickMapa}>
          {position && <Marker position={position} icon={customIcon} draggable eventHandlers={eventosPin} />}
        </MapaBase>

        {/* Badge de coordenadas */}
        <div className="absolute top-3 right-3 z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-none px-3 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 shadow-sm">
          {position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : "Selecciona un punto"}
        </div>
      </div>

      {/* Columna Derecha: Inputs Personalizados */}
      <div className="flex flex-col justify-center space-y-4">

        {/* Input Latitud */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
            Latitud
          </label>
          <div className="relative w-full flex items-center">
            <span className="absolute left-3.5 text-blue-600 dark:text-blue-400 pointer-events-none text-base">
              <HiLocationMarker />
            </span>
            <input
              type="text"
              name="lat"
              placeholder="Ej: 29.118..."
              value={coordenadas.lat}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none transition-all"
            />
          </div>
        </div>

        {/* Input Longitud */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
            Longitud
          </label>
          <div className="relative w-full flex items-center">
            <span className="absolute left-3.5 text-blue-600 dark:text-blue-400 pointer-events-none text-base">
              <HiGlobeAlt />
            </span>
            <input
              type="text"
              name="lng"
              placeholder="Ej: -109.96..."
              value={coordenadas.lng}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none transition-all"
            />
          </div>
        </div>

        <div className="rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-500/10 dark:bg-blue-950/20 p-3.5 flex gap-3 items-start mt-2">
          <HiMap className="text-blue-600 dark:text-blue-400 text-lg mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
            Haz clic en el mapa para colocar el pin o arrástralo para ajustarlo; las coordenadas se capturan automáticamente.
          </p>
        </div>

      </div>
    </div>
  );
}
