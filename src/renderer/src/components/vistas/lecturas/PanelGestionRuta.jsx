/**
 * PanelGestionRuta.jsx
 * Panel izquierdo para gestionar la lista de clientes en una ruta.
 * Soporta 3 modos de orden: Número de Predio, ID, Personalizado (drag & drop).
 * Cada cliente expone sus medidores con coordenadas como puntos de la ruta.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, Chip, Spinner } from "@nextui-org/react";
import { 
    HiSearch, 
    HiX, 
    HiPlus, 
    HiChevronDown, 
    HiChevronUp, 
    HiMenu, 
    HiLocationMarker, 
    HiMap, 
    HiInformationCircle,
    HiExclamationCircle
} from "react-icons/hi";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

const norm = (str) =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function reconstruirLista(puntosRuta, allMedidores, allClientes) {
  const seenClientes = new Set();
  const clienteMedMap = new Map();

  puntosRuta.forEach((punto) => {
    const med = allMedidores.find((m) => m.id === punto.id);
    if (!med || !med.cliente_id) return;
    if (!clienteMedMap.has(med.cliente_id)) clienteMedMap.set(med.cliente_id, []);
    const existing = clienteMedMap.get(med.cliente_id);
    if (!existing.find((m) => m.id === med.id)) existing.push(med);
  });

  const items = [];
  puntosRuta.forEach((punto) => {
    const med = allMedidores.find((m) => m.id === punto.id);
    if (!med || !med.cliente_id || seenClientes.has(med.cliente_id)) return;
    seenClientes.add(med.cliente_id);
    const cliente = allClientes.find((c) => c.id === med.cliente_id);
    items.push({
      key: `c-${med.cliente_id}`,
      clienteId: med.cliente_id,
      clienteData: cliente || { id: med.cliente_id, nombre: `Cliente #${med.cliente_id}` },
      medidores: clienteMedMap.get(med.cliente_id) || [],
    });
  });
  return items;
}

function derivarPuntos(listaItems) {
  return listaItems.flatMap((item) =>
    item.medidores
      .filter((m) => m.latitud && m.longitud)
      .map((m) => ({
        id: m.id,
        lat: parseFloat(m.latitud),
        lng: parseFloat(m.longitud),
        numero_serie: m.numero_serie,
      }))
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────────────────────────────────────── */

export default function PanelGestionRuta({
  puntosRutaInicial = [],
  modoEdicion = false,
  onPuntosChange,
  erroresCampos = {},
  mostrarErrores = false,
  handleDibujarRuta,
  reiniciarRuta,
  rutaCalculada,
  isSaving = false,
}) {
  const { allClientes } = useClientes();
  const { allMedidores } = useMedidores();

  const [listaItems, setListaItems] = useState([]);
  const [modoOrden, setModoOrden] = useState("personalizado"); 
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [isBuscando, setIsBuscando] = useState(false);
  const [expandidos, setExpandidos] = useState(new Set());
  const [showCiudadMenu, setShowCiudadMenu] = useState(false);
  const [omitidosAviso, setOmitidosAviso] = useState(0);

  const dragIdxRef = useRef(null);
  const dragOverIdxRef = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const initializedRef = useRef(false);
  const skipUpdateRef = useRef(false);

  useEffect(() => {
    if (
      !initializedRef.current &&
      puntosRutaInicial.length > 0 &&
      allMedidores.length > 0 &&
      allClientes.length > 0
    ) {
      initializedRef.current = true;
      const items = reconstruirLista(puntosRutaInicial, allMedidores, allClientes);
      skipUpdateRef.current = true;
      setListaItems(items);
    }
  }, [puntosRutaInicial, allMedidores, allClientes]);

  useEffect(() => {
    if (skipUpdateRef.current) {
      skipUpdateRef.current = false;
      return;
    }
    onPuntosChange?.(derivarPuntos(listaItems));
  }, [listaItems, onPuntosChange]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([]);
      setIsBuscando(false);
      return;
    }
    setIsBuscando(true);
    const t = setTimeout(() => {
      const termino = norm(busqueda);
      const yaEnLista = new Set(listaItems.map((i) => i.clienteId));
      const filtrados = allClientes
        .filter((c) => !yaEnLista.has(c.id))
        .filter((c) =>
          norm(`${c.nombre} ${c.ciudad} ${c.numero_predio}`).includes(termino)
        )
        .filter((c) =>
          allMedidores.some((m) => m.cliente_id === c.id && m.latitud && m.longitud)
        )
        .slice(0, 8);
      setResultados(filtrados);
      setIsBuscando(false);
    }, 250);
    return () => clearTimeout(t);
  }, [busqueda, listaItems, allClientes, allMedidores]);

  const agregarCliente = useCallback(
    (cliente) => {
      const meds = allMedidores.filter(
        (m) => m.cliente_id === cliente.id && m.latitud && m.longitud
      );
      const item = {
        key: `c-${cliente.id}`,
        clienteId: cliente.id,
        clienteData: cliente,
        medidores: meds,
      };
      setListaItems((prev) => {
        const next = [...prev, item];
        if (modoOrden === "numero_predio") {
          return next.sort((a, b) =>
            (a.clienteData.numero_predio || "").localeCompare(
              b.clienteData.numero_predio || "",
              undefined,
              { numeric: true }
            )
          );
        }
        if (modoOrden === "id") {
          return next.sort((a, b) => a.clienteId - b.clienteId);
        }
        return next;
      });
      setBusqueda("");
      setResultados([]);
    },
    [allMedidores, modoOrden]
  );

  const quitarCliente = useCallback((clienteId) => {
    setListaItems((prev) => prev.filter((i) => i.clienteId !== clienteId));
    setExpandidos((prev) => {
      const s = new Set(prev);
      s.delete(clienteId);
      return s;
    });
  }, []);

  const cambiarOrden = useCallback((modo) => {
    setModoOrden(modo);
    if (modo === "numero_predio") {
      setListaItems((prev) =>
        [...prev].sort((a, b) =>
          (a.clienteData.numero_predio || "").localeCompare(
            b.clienteData.numero_predio || "",
            undefined,
            { numeric: true }
          )
        )
      );
    } else if (modo === "id") {
      setListaItems((prev) => [...prev].sort((a, b) => a.clienteId - b.clienteId));
    }
  }, []);

  const toggleExpand = useCallback((clienteId) => {
    setExpandidos((prev) => {
      const s = new Set(prev);
      s.has(clienteId) ? s.delete(clienteId) : s.add(clienteId);
      return s;
    });
  }, []);

  const handleDragStart = useCallback((e, idx) => {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
    dragOverIdxRef.current = idx;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragOverIdx(null);
    const from = dragIdxRef.current;
    const to = dragOverIdxRef.current;
    dragIdxRef.current = null;
    dragOverIdxRef.current = null;
    if (from === null || to === null || from === to) return;
    setListaItems((prev) => {
      const list = [...prev];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return list;
    });
  }, []);

  const handleReiniciar = useCallback(() => {
    setListaItems([]);
    setExpandidos(new Set());
    reiniciarRuta?.();
  }, [reiniciarRuta]);

  const totalMedidores = useMemo(
    () => listaItems.reduce((s, i) => s + i.medidores.length, 0),
    [listaItems]
  );

  const ciudadesDisponibles = useMemo(() => {
    const s = new Set(
      allClientes
        .filter((c) => allMedidores.some((m) => m.cliente_id === c.id && m.latitud && m.longitud))
        .map((c) => c.ciudad)
        .filter(Boolean)
    );
    return [...s].sort();
  }, [allClientes, allMedidores]);

  const agregarTodos = useCallback(
    (ciudad = "") => {
      const yaEnLista = new Set(listaItems.map((i) => i.clienteId));
      const candidatos = allClientes
        .filter((c) => !yaEnLista.has(c.id))
        .filter((c) => !ciudad || norm(c.ciudad) === norm(ciudad))
        .filter((c) => allMedidores.some((m) => m.cliente_id === c.id && m.latitud && m.longitud));
      
      const sinConflicto = candidatos.filter((c) =>
        allMedidores
          .filter((m) => m.cliente_id === c.id && m.latitud && m.longitud)
          .every((m) => !m.ruta_id)
      );
      
      const omitidos = candidatos.length - sinConflicto.length;
      if (sinConflicto.length === 0) {
        if (omitidos > 0) setOmitidosAviso(omitidos);
        setShowCiudadMenu(false);
        return;
      }
      
      if (omitidos > 0) setOmitidosAviso(omitidos);
      
      const nuevos = sinConflicto.map((c) => ({
        key: `c-${c.id}`,
        clienteId: c.id,
        clienteData: c,
        medidores: allMedidores.filter(
          (m) => m.cliente_id === c.id && m.latitud && m.longitud
        ),
      }));
      
      setListaItems((prev) => {
        const merged = [...prev, ...nuevos];
        if (modoOrden === "numero_predio") {
          return merged.sort((a, b) =>
            (a.clienteData.numero_predio || "").localeCompare(
              b.clienteData.numero_predio || "",
              undefined,
              { numeric: true }
            )
          );
        }
        if (modoOrden === "id") {
          return merged.sort((a, b) => a.clienteId - b.clienteId);
        }
        return merged;
      });
      setShowCiudadMenu(false);
    },
    [allClientes, allMedidores, listaItems, modoOrden]
  );

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">

      {/* ── Modos de orden (Segmented Control Style) ── */}
      <div className="shrink-0 pt-4 px-4 sm:px-5">
        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
          Método de Ordenamiento
        </p>
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl w-full">
          {[
            { key: "numero_predio", label: "No. Predio", icon: "🏠" },
            { key: "id",            label: "ID",         icon: "#"  },
            { key: "personalizado", label: "Manual",     icon: "⇅" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => cambiarOrden(opt.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                ${modoOrden === opt.key
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
                }`}
            >
              <span className="opacity-80">{opt.icon}</span> <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
        {modoOrden === "personalizado" && (
          <p className="text-[10px] font-medium text-blue-500 dark:text-blue-400 mt-2 flex items-center gap-1">
            <HiInformationCircle /> Mantén presionado y arrastra las filas para ordenar manualmente.
          </p>
        )}
      </div>

      {/* ── Buscador y Agregar en masa ── */}
      <div className="shrink-0 flex flex-col gap-3 px-4 sm:px-5">
        <div className="flex gap-2">
            <Button
                size="sm"
                variant="flat"
                color="primary"
                onClick={() => agregarTodos("")}
                className="flex-1 font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                startContent={<HiPlus className="w-4 h-4" />}
            >
                Añadir Todos
            </Button>
            <div className="relative">
                <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onClick={() => setShowCiudadMenu((v) => !v)}
                    className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200"
                    endContent={<HiChevronDown className="w-4 h-4" />}
                >
                    Por Ciudad
                </Button>
                {showCiudadMenu && (
                    <div className="absolute z-50 right-0 mt-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                    {ciudadesDisponibles.length === 0 ? (
                        <p className="px-4 py-3 text-xs font-medium text-slate-400 text-center">Sin ciudades disponibles</p>
                    ) : (
                        ciudadesDisponibles.map((ciudad) => (
                        <button
                            key={ciudad}
                            onClick={() => agregarTodos(ciudad)}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-zinc-200 border-b border-slate-100 dark:border-zinc-700/50 last:border-b-0 transition-colors"
                        >
                            {ciudad}
                        </button>
                        ))
                    )}
                    </div>
                )}
            </div>
        </div>

        {/* Campo de Búsqueda Estilo CustomInput */}
        <div className="relative">
            <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                    {isBuscando ? <Spinner size="sm" color="primary" /> : <HiSearch className="w-4 h-4" />}
                </span>
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar cliente para agregar..."
                    className="w-full pl-9 pr-9 py-2 text-sm font-medium border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-sm"
                />
                {busqueda && (
                    <button
                        onClick={() => { setBusqueda(""); setResultados([]); }}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <HiX className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown de Resultados de Búsqueda */}
            {resultados.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {resultados.map((cliente) => {
                            const medsCliente = allMedidores.filter((m) => m.cliente_id === cliente.id && m.latitud && m.longitud);
                            const cnt = medsCliente.length;
                            const rutasConflicto = [...new Set(medsCliente.filter((m) => m.ruta_id).map((m) => m.ruta_nombre).filter(Boolean))];
                            const tieneConflicto = rutasConflicto.length > 0;
                            
                            return (
                                <button
                                    key={cliente.id}
                                    onClick={() => agregarCliente(cliente)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-left transition-colors border-b border-slate-100 dark:border-zinc-700/50 last:border-b-0"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${tieneConflicto ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                                        {(cliente.nombre || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate leading-tight mb-0.5">
                                            {cliente.nombre}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                            {cliente.numero_predio ? `Predio #${cliente.numero_predio} · ` : ""}
                                            {cnt} {cnt !== 1 ? "medidores" : "medidor"} c/coord.
                                        </p>
                                        {tieneConflicto && (
                                            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                                                ⚠ Ya en: {rutasConflicto.join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`p-1.5 rounded-md ${tieneConflicto ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'}`}>
                                        <HiPlus className="w-4 h-4 shrink-0" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Mensaje Sin Resultados */}
            {busqueda.trim() && !isBuscando && resultados.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg p-4 text-center">
                    <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">Sin resultados disponibles</p>
                    <p className="text-[10px] text-slate-400 mt-1">El cliente ya está en la lista o no tiene medidores georreferenciados.</p>
                </div>
            )}
        </div>
      </div>

      {/* ── Aviso clientes omitidos ── */}
      {omitidosAviso > 0 && (
        <div className="shrink-0 mx-4 sm:mx-5">
            <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-xl px-4 py-3">
                <HiExclamationCircle className="text-orange-500 w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-orange-700 dark:text-orange-300 text-xs font-medium flex-1 leading-relaxed">
                    Se omitieron <strong>{omitidosAviso} {omitidosAviso !== 1 ? "clientes" : "cliente"}</strong> porque sus medidores ya pertenecen a otra ruta activa.
                </span>
                <button onClick={() => setOmitidosAviso(0)} className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors">
                    <HiX className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}

      {/* ── Cabecera de la lista ── */}
      <div className="flex items-center justify-between shrink-0 px-4 sm:px-5 mt-2">
        <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          Puntos de la Ruta
          <Chip size="sm" color="default" className="text-[10px] font-black h-5 px-1 bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
            {listaItems.length}
          </Chip>
          {totalMedidores > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 lowercase font-medium">({totalMedidores} meds)</span>
          )}
        </span>
        {listaItems.length > 0 && (
          <button
            onClick={() => {
              setListaItems([]);
              setExpandidos(new Set());
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors"
          >
            Limpiar Lista
          </button>
        )}
      </div>

      {/* ── Lista de clientes (Zona Arrastrable) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 px-4 sm:px-5 pb-4 custom-scrollbar">
        {listaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-60">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <HiMap className="text-3xl text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Ruta Vacía</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[200px]">
              Busca y selecciona clientes en la parte superior para construir la secuencia de la ruta.
            </p>
          </div>
        ) : (
          listaItems.map((item, idx) => {
            const isExpanded = expandidos.has(item.clienteId);
            const isDragTarget = dragOverIdx === idx;
            const offsetPuntos = listaItems.slice(0, idx).reduce((s, i) => s + i.medidores.length, 0);

            return (
              <div
                key={item.key}
                draggable={modoOrden === "personalizado"}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border transition-all duration-200 overflow-hidden
                  ${modoOrden === "personalizado" ? "cursor-grab active:cursor-grabbing" : ""}
                  ${isDragTarget
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-[0.98]"
                    : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-zinc-600 shadow-sm"
                  }`}
              >
                {/* Fila principal */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Número de orden */}
                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 w-5 text-center shrink-0 select-none bg-slate-100 dark:bg-zinc-800 py-1 rounded">
                    {idx + 1}
                  </span>

                  {/* Drag handle (solo modo personalizado) */}
                  {modoOrden === "personalizado" && (
                    <span className="text-slate-300 dark:text-zinc-600 shrink-0 text-lg hover:text-slate-500 transition-colors select-none">
                      <HiMenu />
                    </span>
                  )}

                  {/* Info del Cliente */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate leading-tight mb-0.5">
                      {item.clienteData?.nombre}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                      {item.clienteData?.numero_predio ? `Predio #${item.clienteData.numero_predio}` : `ID: ${item.clienteId}`}
                    </p>
                  </div>

                  {/* Chip de Medidores */}
                  <div className="flex items-center gap-1 shrink-0">
                      {item.medidores.some((m) => m.ruta_id) && (
                        <span className="text-[10px] text-orange-500 font-bold bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded mr-1" title="Contiene medidores en otra ruta">
                            ⚠ Conflicto
                        </span>
                      )}
                      <span className="text-[10px] font-black px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 select-none">
                        {item.medidores.length} med{item.medidores.length > 1 ? 's' : ''}.
                      </span>
                  </div>

                  {/* Controles: Expandir y Quitar */}
                  <div className="flex items-center gap-1 shrink-0 border-l border-slate-100 dark:border-zinc-800 pl-2 ml-1">
                      <button
                        onClick={() => toggleExpand(item.clienteId)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Ver medidores"
                      >
                        {isExpanded ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => quitarCliente(item.clienteId)}
                        className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Quitar de la ruta"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                  </div>
                </div>

                {/* Sub-lista medidores (expandida) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-2 space-y-1.5">
                    {item.medidores.map((m, mIdx) => (
                      <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg">
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 w-5 h-5 flex items-center justify-center rounded shrink-0">
                          {offsetPuntos + mIdx + 1}
                        </span>
                        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-200 shrink-0">
                                {m.numero_serie}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate flex items-center gap-1">
                                <HiLocationMarker className="shrink-0" /> {m.ubicacion || "Sin ubicación específica"}
                            </span>
                        </div>
                        {m.ruta_id && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500 shrink-0 ml-auto bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                            ⚠ {m.ruta_nombre}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Errores Inferiores ── */}
      {mostrarErrores && (erroresCampos.puntos || erroresCampos.rutaCalculada) && (
        <div className="shrink-0 mx-4 sm:mx-5 mb-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-3 flex gap-3 items-start animate-in fade-in">
          <HiExclamationCircle className="text-red-500 w-5 h-5 shrink-0" />
          <div className="flex flex-col gap-0.5">
              {erroresCampos.puntos && <p className="text-xs font-bold text-red-700 dark:text-red-400">Agrega al menos 2 clientes con medidores a la lista.</p>}
              {erroresCampos.rutaCalculada && <p className="text-xs font-bold text-red-700 dark:text-red-400">Es necesario Calcular la Ruta antes de poder guardarla.</p>}
          </div>
        </div>
      )}

      {/* ── Acciones Finales (Calcular y Reiniciar) ── */}
      <div className="flex gap-3 shrink-0 px-4 sm:px-5 pb-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
        <Button
          color="primary"
          variant={rutaCalculada ? "flat" : "solid"}
          onClick={handleDibujarRuta}
          className={`flex-1 font-bold ${!rutaCalculada ? 'shadow-md shadow-blue-500/30' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'}`}
          isDisabled={totalMedidores < 2 || isSaving}
          startContent={<HiMap className="text-lg" />}
        >
          {rutaCalculada ? "Recalcular Ruta" : "Calcular Ruta"}
          {rutaCalculada?.distancia_total_km && (
            <span className="ml-1 text-[10px] font-black bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md">
              {rutaCalculada.distancia_total_km.toFixed(1)} km
            </span>
          )}
        </Button>
        <Button
          color="danger"
          variant="flat"
          onClick={handleReiniciar}
          isDisabled={isSaving}
          className="font-bold px-6"
        >
          Reiniciar
        </Button>
      </div>
    </div>
  );
}