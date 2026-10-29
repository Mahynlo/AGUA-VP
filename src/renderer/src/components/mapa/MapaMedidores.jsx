import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import MapaBase from "./MapaBase";
import FichaMedidor, { LeyendaMapa } from "./FichaMedidor";
import { COLORES_PUNTO, estiloPunto, coordenadas } from "./mapConfig";

// Tamaño de celda de agrupación por nivel de zoom (en grados).
// A zoom >= 16 se muestran todos los medidores individuales.
const CLUSTER_CELL_SIZES = [
  { minZoom: 16, size: null },
  { minZoom: 15, size: 0.0015 },
  { minZoom: 14, size: 0.003 },
  { minZoom: 0, size: 0.006 },
];

function computeClusters(items, zoom) {
  const entry = CLUSTER_CELL_SIZES.find((e) => zoom >= e.minZoom);
  if (!entry?.size) return items.map((item) => ({ type: "single", item }));

  const { size } = entry;
  const cells = new Map();
  for (const item of items) {
    const key = `${Math.floor(item.coords[0] / size)},${Math.floor(item.coords[1] / size)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(item);
  }
  return Array.from(cells.values()).map((group) => {
    if (group.length === 1) return { type: "single", item: group[0] };
    const lat = group.reduce((s, g) => s + g.coords[0], 0) / group.length;
    const lng = group.reduce((s, g) => s + g.coords[1], 0) / group.length;
    return { type: "cluster", count: group.length, lat, lng, id: `cl-${group[0].medidor.id}` };
  });
}

/** Color y etiqueta de estado de un medidor (los mismos que usa la leyenda) */
const clasificar = (m) => {
  if (m.estado_medidor && m.estado_medidor !== "Activo") {
    return { color: COLORES_PUNTO.inactivo, estado: { texto: m.estado_medidor, tono: "rojo" } };
  }
  if (m.cliente_id) return { color: COLORES_PUNTO.asignado, estado: { texto: "Activo", tono: "azul" } };
  return { color: COLORES_PUNTO.disponible, estado: { texto: "Disponible", tono: "gris" } };
};

const iconosGrupo = new Map();
const iconoGrupo = (count) => {
  if (!iconosGrupo.has(count)) {
    const size = count < 10 ? 36 : count < 100 ? 44 : 52;
    iconosGrupo.set(count, new DivIcon({
      html: `<div class="aguavp-cluster" style="width:${size}px;height:${size}px;line-height:${size - 6}px;">${count}</div>`,
      className: "",
      iconSize: [size, size],
    }));
  }
  return iconosGrupo.get(count);
};

// Sigue zoom y límites visibles (un solo listener: 'moveend' cubre pan y zoom), encuadra al
// cambiar los filtros y lleva al medidor seleccionado.
const ControlMedidores = ({ items, selectedMedidor, markerRefs, mapaRef, onViewChange }) => {
  const map = useMap();
  mapaRef.current = map;
  const primeraVez = useRef(true);

  useEffect(() => {
    const update = () => onViewChange(map.getZoom(), map.getBounds().pad(0.25));
    update();
    map.on("moveend", update);
    return () => map.off("moveend", update);
  }, [map, onViewChange]);

  // Lleva a un medidor (zoom 18: sin grupos) y abre su ficha cuando ya está dibujado: al terminar
  // el movimiento el mapa se redibuja con el zoom nuevo, y ahí ya existe su punto.
  const irAMedidor = useCallback((id, coords) => {
    let cancelado = false;
    const abrir = () => setTimeout(() => {
      if (!cancelado) markerRefs.current[id]?.openPopup();
    }, 80);
    map.once("moveend", abrir);
    map.setView(coords, 18);
    const respaldo = setTimeout(() => !cancelado && markerRefs.current[id]?.openPopup(), 700);
    return () => {
      cancelado = true;
      map.off("moveend", abrir);
      clearTimeout(respaldo);
    };
  }, [map, markerRefs]);

  // Al cambiar los filtros, encuadrar los medidores que quedaron (el primer encuadre lo hace MapaBase);
  // si queda uno solo, se abre su ficha como antes
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    if (items.length === 1) return irAMedidor(items[0].medidor.id, items[0].coords);
    if (items.length > 1) map.fitBounds(items.map((i) => i.coords), { padding: [40, 40], maxZoom: 17 });
  }, [items, map, irAMedidor]);

  // Medidor elegido en la lista
  useEffect(() => {
    const coords = selectedMedidor && coordenadas(selectedMedidor.latitud, selectedMedidor.longitud);
    if (!coords) return;
    return irAMedidor(selectedMedidor.id, coords);
  }, [selectedMedidor, irAMedidor]);

  return null;
};

const MapaMedidores = ({ medidores = [], selectedMedidor }) => {
  const [zoom, setZoom] = useState(15);
  const [bounds, setBounds] = useState(null);
  const markerRefs = useRef({});
  const mapaRef = useRef(null);

  const items = useMemo(
    () => medidores
      .map((m) => ({ medidor: m, coords: coordenadas(m.latitud, m.longitud), ...clasificar(m) }))
      .filter((i) => i.coords),
    [medidores]
  );

  const limites = useMemo(() => items.map((i) => i.coords), [items]);

  const handleViewChange = React.useCallback((z, b) => {
    setZoom(z);
    setBounds(b);
  }, []);

  // Solo se dibujan los medidores dentro de la vista (con 25% de margen); el seleccionado siempre
  const visibles = useMemo(() => {
    if (!bounds) return items;
    const dentro = items.filter((i) => bounds.contains(i.coords));
    if (selectedMedidor && !dentro.some((i) => i.medidor.id === selectedMedidor.id)) {
      const sel = items.find((i) => i.medidor.id === selectedMedidor.id);
      if (sel) dentro.push(sel);
    }
    return dentro;
  }, [items, bounds, selectedMedidor]);

  const clusters = useMemo(() => computeClusters(visibles, zoom), [visibles, zoom]);

  const marcadores = useMemo(() => clusters.map((c) => {
    if (c.type === "cluster") {
      return (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={iconoGrupo(c.count)}
          eventHandlers={{ click: () => mapaRef.current?.setView([c.lat, c.lng], Math.min(zoom + 2, 18)) }}
        />
      );
    }

    const { medidor, coords, color, estado } = c.item;
    return (
      <CircleMarker
        key={medidor.id}
        center={coords}
        radius={zoom >= 17 ? 9 : 7}
        pathOptions={estiloPunto(color)}
        ref={(el) => {
          if (el) markerRefs.current[medidor.id] = el;
          else delete markerRefs.current[medidor.id];
        }}
      >
        <Popup className="custom-popup" autoPanPadding={[40, 40]}>
          <FichaMedidor
            serie={medidor.numero_serie}
            color={color}
            estado={estado}
            cliente={medidor.cliente_nombre}
            predio={medidor.numero_predio}
            direccion={medidor.ubicacion || "Ubicación no especificada"}
            coords={coords}
          />
        </Popup>
      </CircleMarker>
    );
  }), [clusters, zoom]);

  const conteo = useMemo(() => {
    const c = { asignado: 0, disponible: 0, inactivo: 0 };
    for (const i of items) {
      if (i.color === COLORES_PUNTO.inactivo) c.inactivo++;
      else if (i.color === COLORES_PUNTO.asignado) c.asignado++;
      else c.disponible++;
    }
    return c;
  }, [items]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
      <MapaBase
        zoom={15}
        limites={limites}
        superpuesto={
          <LeyendaMapa
            titulo={`${items.length} medidores en el mapa`}
            items={[
              { color: COLORES_PUNTO.asignado, texto: "Con cliente", cantidad: conteo.asignado },
              { color: COLORES_PUNTO.disponible, texto: "Disponibles", cantidad: conteo.disponible },
              ...(conteo.inactivo ? [{ color: COLORES_PUNTO.inactivo, texto: "Inactivos", cantidad: conteo.inactivo }] : []),
            ]}
          />
        }
      >
        <ControlMedidores
          items={items}
          selectedMedidor={selectedMedidor}
          markerRefs={markerRefs}
          mapaRef={mapaRef}
          onViewChange={handleViewChange}
        />
        {marcadores}
      </MapaBase>
    </div>
  );
};

export default React.memo(MapaMedidores);
