import React, { useMemo } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { HiExclamation } from "react-icons/hi";
import MapaBase from "./MapaBase";
import FichaMedidor from "./FichaMedidor";
import { COLORES_PUNTO, estiloPunto, coordenadas } from "./mapConfig";

/**
 * Mapa del punto que se está leyendo en el carrusel de lecturas. Al pasar al siguiente punto,
 * el mapa se mueve a él conservando el zoom elegido (antes el marcador cambiaba pero la vista no).
 *
 * @param {number|string} lat
 * @param {number|string} lng
 * @param {{ id, nombre, predio, direccion, medidor }} cliente  datos del punto actual
 */
const MapaLecturas = ({ lat, lng, cliente }) => {
  const coords = useMemo(() => coordenadas(lat, lng), [lat, lng]);

  const ficha = (
    <FichaMedidor
      serie={cliente?.medidor}
      color={COLORES_PUNTO.pendiente}
      cliente={cliente?.nombre}
      predio={cliente?.predio}
      direccion={cliente?.direccion}
      coords={coords}
    />
  );

  return (
    <MapaBase
      centro={coords}
      zoom={17}
      superpuesto={
        <div className="absolute top-3 right-3 z-[500] rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700 shadow-sm">
          {coords ? ficha : (
            <div className="p-3 max-w-[260px] flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <HiExclamation className="text-base shrink-0" />
              <span>
                El medidor <b>{cliente?.medidor || "—"}</b> no tiene coordenadas registradas.
                Se pueden agregar desde Medidores → Editar.
              </span>
            </div>
          )}
        </div>
      }
    >
      {coords && (
        <CircleMarker center={coords} radius={11} pathOptions={estiloPunto(COLORES_PUNTO.pendiente, true)}>
          <Popup className="custom-popup" autoPanPadding={[40, 40]}>
            {ficha}
          </Popup>
        </CircleMarker>
      )}
    </MapaBase>
  );
};

MapaLecturas.displayName = "MapaLecturas";

// Solo se vuelve a dibujar si cambia el punto (coordenadas o medidor)
export default React.memo(MapaLecturas, (prev, next) => (
  prev.lat === next.lat &&
  prev.lng === next.lng &&
  prev.cliente?.id === next.cliente?.id &&
  prev.cliente?.nombre === next.cliente?.nombre &&
  prev.cliente?.medidor === next.cliente?.medidor
));
