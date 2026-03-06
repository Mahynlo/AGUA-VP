/**
 * PanelGestionRuta.jsx
 * Panel izquierdo para gestionar la lista de clientes en una ruta.
 * Soporta 3 modos de orden: Número de Predio, ID, Personalizado (drag & drop).
 * Cada cliente expone sus medidores con coordenadas como puntos de la ruta.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, Chip, Spinner } from "@nextui-org/react";
import { HiSearch, HiX, HiPlus, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { useClientes } from "../../../context/ClientesContext";
import { useMedidores } from "../../../context/MedidoresContext";

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

/** Normaliza texto quitando acentos y pasando a minúsculas */
const norm = (str) =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Reconstruye la listaItems a partir de puntosRuta existentes (modo edición).
 * Mantiene el orden de primera aparición de cada cliente.
 */
function reconstruirLista(puntosRuta, allMedidores, allClientes) {
  const seenClientes = new Set();
  // Map: clienteId → medidores[]  (en orden de aparición en puntosRuta)
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

/** Convierte listaItems a la forma puntosRuta que necesita el hook */
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

/**
 * @param {object[]}  puntosRutaInicial  – puntosRuta del hook (para init en edición)
 * @param {boolean}   modoEdicion
 * @param {function}  onPuntosChange    – callback(puntos) cada vez cambia la lista
 * @param {object}    erroresCampos
 * @param {boolean}   mostrarErrores
 * @param {function}  handleDibujarRuta
 * @param {function}  reiniciarRuta     – del hook; aquí se envuelve para limpiar list
 * @param {object}    rutaCalculada
 * @param {boolean}   isSaving
 */
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

  // ── Lista interna (source of truth para el orden) ──
  const [listaItems, setListaItems] = useState([]);
  const [modoOrden, setModoOrden] = useState("personalizado"); // 'numero_predio' | 'id' | 'personalizado'
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [isBuscando, setIsBuscando] = useState(false);
  const [expandidos, setExpandidos] = useState(new Set());
  const [showCiudadMenu, setShowCiudadMenu] = useState(false);
  const [omitidosAviso, setOmitidosAviso] = useState(0);

  // ── Drag & drop ──
  const dragIdxRef = useRef(null);
  const dragOverIdxRef = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // ── Init refs (edit mode) ──
  const initializedRef = useRef(false);
  const skipUpdateRef = useRef(false);

  /* ── Inicialización en modo edición ──────────────────────────────────────── */
  useEffect(() => {
    if (
      !initializedRef.current &&
      puntosRutaInicial.length > 0 &&
      allMedidores.length > 0 &&
      allClientes.length > 0
    ) {
      initializedRef.current = true;
      const items = reconstruirLista(puntosRutaInicial, allMedidores, allClientes);
      skipUpdateRef.current = true; // no propagar este set
      setListaItems(items);
    }
  }, [puntosRutaInicial, allMedidores, allClientes]);

  /* ── Propagar cambios de listaItems al hook ──────────────────────────────── */
  useEffect(() => {
    if (skipUpdateRef.current) {
      skipUpdateRef.current = false;
      return;
    }
    onPuntosChange?.(derivarPuntos(listaItems));
  }, [listaItems]);

  /* ── Búsqueda con debounce ───────────────────────────────────────────────── */
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

  /* ── Agregar cliente ─────────────────────────────────────────────────────── */
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

  /* ── Quitar cliente ──────────────────────────────────────────────────────── */
  const quitarCliente = useCallback((clienteId) => {
    setListaItems((prev) => prev.filter((i) => i.clienteId !== clienteId));
    setExpandidos((prev) => {
      const s = new Set(prev);
      s.delete(clienteId);
      return s;
    });
  }, []);

  /* ── Cambiar modo de orden ───────────────────────────────────────────────── */
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
    // 'personalizado': mantiene el orden actual, habilita drag
  }, []);

  /* ── Expandir/colapsar ───────────────────────────────────────────────────── */
  const toggleExpand = useCallback((clienteId) => {
    setExpandidos((prev) => {
      const s = new Set(prev);
      s.has(clienteId) ? s.delete(clienteId) : s.add(clienteId);
      return s;
    });
  }, []);

  /* ── Drag & drop (nativo HTML5) ──────────────────────────────────────────── */
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

  /* ── Reiniciar todo ──────────────────────────────────────────────────────── */
  const handleReiniciar = useCallback(() => {
    setListaItems([]);
    setExpandidos(new Set());
    reiniciarRuta?.();
  }, [reiniciarRuta]);

  /* ── Estadísticas ────────────────────────────────────────────────────────── */
  const totalMedidores = useMemo(
    () => listaItems.reduce((s, i) => s + i.medidores.length, 0),
    [listaItems]
  );

  /* ── Ciudades disponibles para filtro ───────────────────────────────────── */
  const ciudadesDisponibles = useMemo(() => {
    const s = new Set(
      allClientes
        .filter((c) => allMedidores.some((m) => m.cliente_id === c.id && m.latitud && m.longitud))
        .map((c) => c.ciudad)
        .filter(Boolean)
    );
    return [...s].sort();
  }, [allClientes, allMedidores]);

  /* ── Agregar todos (opcionalmente filtrado por ciudad) ───────────────────── */
  const agregarTodos = useCallback(
    (ciudad = "") => {
      const yaEnLista = new Set(listaItems.map((i) => i.clienteId));
      const candidatos = allClientes
        .filter((c) => !yaEnLista.has(c.id))
        .filter((c) => !ciudad || norm(c.ciudad) === norm(ciudad))
        .filter((c) => allMedidores.some((m) => m.cliente_id === c.id && m.latitud && m.longitud));
      // Excluir clientes cuyos medidores estén todos ya asignados a otra ruta
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
    <div className="flex flex-col gap-3 h-full overflow-hidden">

      {/* ── Modos de orden ── */}
      <div className="shrink-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
          Ordenar lista
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "numero_predio", label: "No. Predio", icon: "🏠" },
            { key: "id",            label: "ID Cliente",  icon: "#"  },
            { key: "personalizado", label: "Personalizado", icon: "⇅" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => cambiarOrden(opt.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border
                ${modoOrden === opt.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600"
                }`}
            >
              <span>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
        {modoOrden === "personalizado" && (
          <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-1">
            Arrastra las filas para cambiar el orden
          </p>
        )}
      </div>

      {/* ── Agregar en masa ── */}
      <div className="relative shrink-0 flex gap-2">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          onClick={() => agregarTodos("")}
          className="text-xs flex-1"
          startContent={<HiPlus className="w-3.5 h-3.5" />}
        >
          Agregar todos
        </Button>
        <div className="relative">
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            onClick={() => setShowCiudadMenu((v) => !v)}
            className="text-xs"
            endContent={<HiChevronDown className="w-3.5 h-3.5" />}
          >
            Por ciudad
          </Button>
          {showCiudadMenu && (
            <div className="absolute z-50 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
              {ciudadesDisponibles.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">Sin ciudades disponibles</p>
              ) : (
                ciudadesDisponibles.map((ciudad) => (
                  <button
                    key={ciudad}
                    onClick={() => agregarTodos(ciudad)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                  >
                    {ciudad}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Aviso clientes omitidos por conflicto de ruta ── */}
      {omitidosAviso > 0 && (
        <div className="shrink-0 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          <span className="text-amber-600 dark:text-amber-400 text-xs flex-1">
            ⚠ {omitidosAviso} cliente{omitidosAviso !== 1 ? "s" : ""} omitido{omitidosAviso !== 1 ? "s" : ""} — sus medidores ya tienen ruta asignada.
          </span>
          <button onClick={() => setOmitidosAviso(0)} className="text-amber-400 hover:text-amber-600 transition-colors">
            <HiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Buscador para agregar ── */}
      <div className="relative shrink-0">
        <div className="relative flex items-center">
          <span className="absolute left-3 text-gray-400 pointer-events-none">
            {isBuscando
              ? <Spinner size="sm" color="primary" className="scale-75" />
              : <HiSearch className="w-4 h-4" />}
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente para agregar…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {busqueda && (
            <button
              onClick={() => { setBusqueda(""); setResultados([]); }}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown resultados */}
        {resultados.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
            {resultados.map((cliente) => {
              const medsCliente = allMedidores.filter(
                (m) => m.cliente_id === cliente.id && m.latitud && m.longitud
              );
              const cnt = medsCliente.length;
              const rutasConflicto = [...new Set(
                medsCliente.filter((m) => m.ruta_id).map((m) => m.ruta_nombre).filter(Boolean)
              )];
              const tieneConflicto = rutasConflicto.length > 0;
              return (
                <button
                  key={cliente.id}
                  onClick={() => agregarCliente(cliente)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${tieneConflicto ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                    {(cliente.nombre || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {cliente.nombre}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {cliente.numero_predio ? `Predio #${cliente.numero_predio} · ` : ""}
                      {cnt} medidor{cnt !== 1 ? "es" : ""} con coordenadas
                    </p>
                    {tieneConflicto && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        ⚠ Ya en: {rutasConflicto.join(", ")}
                      </p>
                    )}
                  </div>
                  <HiPlus className={`w-4 h-4 shrink-0 ${tieneConflicto ? 'text-amber-500' : 'text-green-500'}`} />
                </button>
              );
            })}
          </div>
        )}

        {busqueda.trim() && !isBuscando && resultados.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow p-3 text-center text-xs text-gray-500">
            Sin resultados — ya está en la lista o no tiene medidores con coordenadas
          </div>
        )}
      </div>

      {/* ── Cabecera de la lista ── */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          📋 Clientes en la ruta
          <Chip size="sm" variant="flat" color="primary" className="text-[11px] h-5">
            {listaItems.length}
          </Chip>
          {totalMedidores > 0 && (
            <span className="text-[11px] text-gray-400">· {totalMedidores} pts</span>
          )}
        </span>
        {listaItems.length > 0 && (
          <button
            onClick={() => {
              setListaItems([]);
              setExpandidos(new Set());
            }}
            className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* ── Lista de clientes ── */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5 custom-scrollbar">
        {listaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin clientes aún</p>
            <p className="text-xs text-gray-400 mt-1">
              Busca y agrega clientes arriba<br />para construir la ruta
            </p>
          </div>
        ) : (
          listaItems.map((item, idx) => {
            const isExpanded = expandidos.has(item.clienteId);
            const isDragTarget = dragOverIdx === idx;
            // Número global del primer medidor de este cliente
            const offsetPuntos = listaItems
              .slice(0, idx)
              .reduce((s, i) => s + i.medidores.length, 0);

            return (
              <div
                key={item.key}
                draggable={modoOrden === "personalizado"}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border transition-all
                  ${modoOrden === "personalizado" ? "cursor-grab active:cursor-grabbing" : ""}
                  ${isDragTarget
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-[0.99]"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
              >
                {/* Fila principal */}
                <div className="flex items-center gap-2 px-2.5 py-2">
                  {/* Número de orden */}
                  <span className="text-[11px] font-bold text-gray-400 w-4 text-center shrink-0 select-none">
                    {idx + 1}
                  </span>

                  {/* Drag handle (solo modo personalizado) */}
                  {modoOrden === "personalizado" && (
                    <span className="text-gray-300 dark:text-gray-600 shrink-0 text-base leading-none select-none">
                      ⣿
                    </span>
                  )}

                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 select-none">
                    {(item.clienteData?.nombre || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate leading-tight">
                      {item.clienteData?.nombre}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {item.clienteData?.numero_predio
                        ? `Predio #${item.clienteData.numero_predio}`
                        : `ID: ${item.clienteId}`}
                    </p>
                    {item.medidores.some((m) => m.ruta_id) && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-tight">
                        ⚠ Medidor en otra ruta
                      </p>
                    )}
                  </div>

                  {/* Chip medidores */}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 shrink-0 select-none">
                    {item.medidores.length}💧
                  </span>

                  {/* Expandir */}
                  <button
                    onClick={() => toggleExpand(item.clienteId)}
                    className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 shrink-0 transition-colors"
                    title="Ver medidores"
                  >
                    {isExpanded
                      ? <HiChevronUp className="w-4 h-4" />
                      : <HiChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Quitar */}
                  <button
                    onClick={() => quitarCliente(item.clienteId)}
                    className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 shrink-0 transition-colors"
                    title="Quitar de la ruta"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-lista medidores (expandida) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 space-y-1 bg-gray-50 dark:bg-gray-900/30 rounded-b-xl">
                    {item.medidores.map((m, mIdx) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 py-0.5 text-[11px]"
                      >
                        <span className="text-orange-500 font-bold w-5 text-center shrink-0">
                          {offsetPuntos + mIdx + 1}
                        </span>
                        <span className="text-blue-400 shrink-0">💧</span>
                        <span className="font-mono font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                          {m.numero_serie}
                        </span>
                        <span className="text-gray-400 truncate">{m.ubicacion || "—"}</span>
                        {m.ruta_id && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0 ml-auto">
                            ⚠ {m.ruta_nombre || "otra ruta"}
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

      {/* ── Errores ── */}
      {mostrarErrores && (erroresCampos.puntos || erroresCampos.rutaCalculada) && (
        <div className="shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {erroresCampos.puntos && "⚠️ Agrega al menos 2 clientes con medidores"}
            {erroresCampos.rutaCalculada && "⚠️ Calcula la ruta antes de guardar"}
          </p>
        </div>
      )}

      {/* ── Acciones de ruta ── */}
      <div className="flex gap-2 shrink-0">
        <Button
          color="secondary"
          size="sm"
          onClick={handleDibujarRuta}
          className="flex-1"
          isDisabled={totalMedidores < 2 || isSaving}
          startContent={<span>🗺️</span>}
        >
          {rutaCalculada ? "Recalcular Ruta" : "Calcular Ruta"}
          {rutaCalculada?.distancia_total_km && (
            <span className="ml-1 text-[10px] opacity-80">
              {rutaCalculada.distancia_total_km.toFixed(1)} km
            </span>
          )}
        </Button>
        <Button
          color="danger"
          size="sm"
          variant="flat"
          onClick={handleReiniciar}
          isDisabled={isSaving}
        >
          Reiniciar
        </Button>
      </div>
    </div>
  );
}
