/**
 * PanelGestionRuta.jsx
 * Panel izquierdo para gestionar la lista de clientes en una ruta.
 * Soporta 3 modos de orden: Número de Predio, ID, Personalizado (drag & drop).
 * Cada cliente expone sus medidores con coordenadas como puntos de la ruta.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function reconstruirLista(puntosRuta, allMedidores, allClientes) {
  const seenClientes = new Set();
  const clienteMedMap = new Map();

  puntosRuta.forEach((punto) => {
    const med = allMedidores.find((m) => String(m.id) === String(punto.id));
    if (!med || !med.cliente_id) return;
    const cId = String(med.cliente_id);
    if (!clienteMedMap.has(cId)) clienteMedMap.set(cId, []);
    const existing = clienteMedMap.get(cId);
    if (!existing.find((m) => String(m.id) === String(med.id))) existing.push(med);
  });

  const items = [];
  puntosRuta.forEach((punto) => {
    const med = allMedidores.find((m) => String(m.id) === String(punto.id));
    if (!med || !med.cliente_id) return;
    const cId = String(med.cliente_id);
    if (seenClientes.has(cId)) return;
    seenClientes.add(cId);
    const cliente = allClientes.find((c) => String(c.id) === cId);
    items.push({
      key: `c-${cId}`,
      clienteId: med.cliente_id,
      clienteData: cliente || { id: med.cliente_id, nombre: `Cliente #${med.cliente_id}` },
      medidores: clienteMedMap.get(cId) || [],
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

  const isInitialMount = useRef(true);
  const initializedRef = useRef(false);
  const skipUpdateRef = useRef(false);

  useEffect(() => {
    if (
      puntosRutaInicial &&
      puntosRutaInicial.length > 0 &&
      allMedidores.length > 0 &&
      allClientes.length > 0
    ) {
      const items = reconstruirLista(puntosRutaInicial, allMedidores, allClientes);
      if (items.length > 0) {
        initializedRef.current = true;
        skipUpdateRef.current = true;
        setListaItems(items);
      }
    }
  }, [puntosRutaInicial, allMedidores, allClientes]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">

      {/* ── BARRA SUPERIOR INTEGRADA (Buscador + Añadir en masa + Ordenamiento) ── */}
      <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 flex flex-col gap-2.5">
        
        {/* Fila 1: Buscador + Botón Añadir Todos + Selector Por Ciudad */}
        <div className="flex items-center gap-2">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
              {isBuscando ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              ) : (
                <HiSearch className="w-4 h-4" />
              )}
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente para agregar..."
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-none h-10"
            />
            {busqueda && (
              <button
                onClick={() => { setBusqueda(""); setResultados([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                <HiX className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown de Resultados de Búsqueda */}
            {resultados.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {resultados.map((cliente) => {
                    const medsCliente = allMedidores.filter((m) => m.cliente_id === cliente.id && m.latitud && m.longitud);
                    const cnt = medsCliente.length;
                    const rutasConflicto = [...new Set(medsCliente.filter((m) => m.ruta_id).map((m) => m.ruta_nombre).filter(Boolean))];
                    const tieneConflicto = rutasConflicto.length > 0;

                    return (
                      <button
                        key={cliente.id}
                        onClick={() => agregarCliente(cliente)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-xl text-left transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${tieneConflicto ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                          {(cliente.nombre || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate leading-tight">
                            {cliente.nombre}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                            {cliente.numero_predio ? `Predio #${cliente.numero_predio} · ` : ""}
                            {cnt} {cnt !== 1 ? "medidores" : "medidor"}
                          </p>
                          {tieneConflicto && (
                            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                              ⚠ En ruta: {rutasConflicto.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className={`p-1 rounded-lg ${tieneConflicto ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                          <HiPlus className="w-3.5 h-3.5 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mensaje Sin Resultados */}
            {busqueda.trim() && !isBuscando && resultados.length === 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-3 text-center">
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Sin resultados disponibles</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">El cliente ya está en la lista o no tiene medidores con coordenadas.</p>
              </div>
            )}
          </div>

          {/* Botón Añadir Todos */}
          <button
            onClick={() => agregarTodos("")}
            className="h-10 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-none"
            title="Añadir todos los clientes con medidores georreferenciados sin asignar"
          >
            <HiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Todos</span>
          </button>

          {/* Selector Por Ciudad */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowCiudadMenu((v) => !v)}
              className="h-10 px-3 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-none"
              title="Filtrar y añadir por ciudad"
            >
              <span>Ciudad</span>
              <HiChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {showCiudadMenu && (
              <div className="absolute z-50 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden min-w-[190px] animate-in fade-in zoom-in-95 duration-150 p-1">
                {ciudadesDisponibles.length === 0 ? (
                  <p className="px-3 py-2 text-xs font-medium text-slate-400 text-center">Sin ciudades disponibles</p>
                ) : (
                  ciudadesDisponibles.map((ciudad) => (
                    <button
                      key={ciudad}
                      onClick={() => agregarTodos(ciudad)}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      {ciudad}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fila 2: Selector de Ordenamiento Compacto + Contador + Limpiar */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Píldoras de orden */}
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-zinc-800/80 p-0.5 rounded-lg">
            {[
              { key: "numero_predio", label: "No. Predio", icon: "🏠" },
              { key: "id", label: "ID", icon: "#" },
              { key: "personalizado", label: "Manual ⇅", icon: "" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => cambiarOrden(opt.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                  modoOrden === opt.key
                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Resumen de puntos y botón limpiar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              <span className="font-mono font-black text-amber-600 dark:text-amber-400">{listaItems.length}</span> pts
              {totalMedidores > 0 && <span className="text-[10px] text-slate-400 dark:text-zinc-500"> ({totalMedidores} meds)</span>}
            </span>
            {listaItems.length > 0 && (
              <button
                onClick={() => {
                  setListaItems([]);
                  setExpandidos(new Set());
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                title="Vaciar lista de puntos"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Aviso clientes omitidos (compacto) ── */}
      {omitidosAviso > 0 && (
        <div className="shrink-0 mx-3 my-1">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5">
            <HiExclamationCircle className="text-amber-600 dark:text-amber-400 w-4 h-4 shrink-0" />
            <span className="text-amber-800 dark:text-amber-300 text-[11px] font-medium flex-1">
              Se omitieron <strong>{omitidosAviso}</strong> cliente(s) ya asignados a otra ruta.
            </span>
            <button onClick={() => setOmitidosAviso(0)} className="text-amber-400 hover:text-amber-600 transition-colors">
              <HiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Lista de Clientes (Área Scrollable de Alta Densidad) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 p-3 custom-scrollbar">
        {listaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <HiMap className="text-xl" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Ruta sin puntos agregados</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 max-w-[220px]">
              Busca clientes o presiona "Todos" arriba para definir el recorrido.
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
                className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                  modoOrden === "personalizado" ? "cursor-grab active:cursor-grabbing" : ""
                } ${
                  isDragTarget
                    ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-md scale-[0.99]"
                    : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm"
                }`}
              >
                {/* Fila principal del cliente */}
                <div className="flex items-center gap-2.5 px-3 py-2">
                  {/* Número de orden */}
                  <span className="text-[10px] font-mono font-black text-slate-500 dark:text-zinc-400 w-5 h-5 flex items-center justify-center shrink-0 select-none bg-slate-100 dark:bg-zinc-800 rounded-md">
                    {idx + 1}
                  </span>

                  {/* Drag handle */}
                  {modoOrden === "personalizado" && (
                    <span className="text-slate-300 dark:text-zinc-600 shrink-0 text-sm hover:text-slate-500 transition-colors select-none">
                      <HiMenu />
                    </span>
                  )}

                  {/* Info del Cliente */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate leading-tight">
                      {item.clienteData?.nombre}
                    </p>
                    {item.clienteData?.numero_predio && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded shrink-0">
                        #{item.clienteData.numero_predio}
                      </span>
                    )}
                  </div>

                  {/* Medidores y Conflicto */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.medidores.some((m) => m.ruta_id) && (
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded" title="Contiene medidores en otra ruta">
                        ⚠ Conflicto
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 select-none">
                      {item.medidores.length} med{item.medidores.length > 1 ? 's' : ''}.
                    </span>

                    {/* Botones de acción */}
                    <button
                      onClick={() => toggleExpand(item.clienteId)}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors"
                      title="Ver medidores asignados"
                    >
                      {isExpanded ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => quitarCliente(item.clienteId)}
                      className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Quitar de la ruta"
                    >
                      <HiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-lista de medidores (expandida) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 p-2 space-y-1">
                    {item.medidores.map((m, mIdx) => (
                      <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-lg text-xs">
                        <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {offsetPuntos + mIdx + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-200 text-xs">
                          {m.numero_serie}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1 ml-auto">
                          <HiLocationMarker className="w-3 h-3 text-slate-400" /> {m.ubicacion || "Sin ubicación"}
                        </span>
                        {m.ruta_id && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
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
        <div className="shrink-0 mx-3 mb-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 flex gap-2.5 items-center animate-in fade-in">
          <HiExclamationCircle className="text-rose-500 w-4 h-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            {erroresCampos.puntos && <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Agrega al menos 2 clientes con medidores a la lista.</p>}
            {erroresCampos.rutaCalculada && <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Es necesario Calcular la Ruta antes de poder guardarla.</p>}
          </div>
        </div>
      )}

      {/* ── Acciones Finales (Calcular y Reiniciar) ── */}
      <div className="flex gap-2 shrink-0 p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
        <button
          onClick={handleDibujarRuta}
          disabled={totalMedidores < 2 || isSaving}
          className={`flex-1 font-bold flex items-center justify-center gap-2 px-4 h-10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs shadow-sm ${
            rutaCalculada
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
              : 'bg-amber-600 text-white shadow-amber-500/20 hover:bg-amber-700'
          }`}
        >
          <HiMap className="w-4 h-4" />
          {rutaCalculada ? "Recalcular Ruta" : "Calcular Ruta"}
          {rutaCalculada?.distancia_total_km && (
            <span className="ml-1 text-[10px] font-mono font-black bg-amber-500/20 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">
              {rutaCalculada.distancia_total_km.toFixed(1)} km
            </span>
          )}
        </button>
        <button
          onClick={handleReiniciar}
          disabled={isSaving}
          className="font-bold px-4 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-200/50 dark:border-rose-900/30 disabled:opacity-50 text-xs transition-colors"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}
