import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { Select, SelectItem } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import ModalRegistrarRuta from "../lecturas/RegistrarRuta";
import RutaCard from "./RutaCard";

import imagenNacori from "../../../assets/images/nacori_mapa_ruta1.png";
import imagenMatape from "../../../assets/images/Matape_mapa_ruta.png";
import imagenAdivino from "../../../assets/images/Adivino_mapa_ruta.png";

import { useRutas } from "../../../context/RutasContext";

export default function TabRutas() {
  const navigate = useNavigate();

  /* ---------------- estados de UI ---------------- */
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");   // completas / incompletas
  const [filtroPueblo, setPueblo] = useState("todos");   // ng / mp / ad
  const [paginaActual, setPagina] = useState(1);
  const [rutasPorPagina, setPorPag] = useState(4);
  const [periodoSel, setPeriodoSel] = useState(null);      // 'YYYY-MM'

  /* ---------------- contexto de rutas ---------------- */
  const { rutas, loading, actualizarRutas, periodoActual } = useRutas();

  /* ----- genera lista de meses disponibles (12 últimos) ----- */
  const opcionesPeriodo = useMemo(() => {
    const hoy = new Date();
    const lista = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const val = d.toISOString().slice(0, 7);      // YYYY-MM
      const label = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
      lista.push({ val, label });
    }
    return lista;          // Máximo: mes actual hacia 11 anteriores
  }, []);

  /* ------ traer rutas cuando el usuario cambia de periodo ------ */
  useEffect(() => {
    if (periodoSel) actualizarRutas(periodoSel);
  }, [periodoSel]);

  /* --------- cálculo de tarjetas por responsive --------- */
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPorPag(w < 640 ? 2 : w < 1024 ? 4 : w < 1280 ? 6 : 8);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /* --------- utilidades prefijo/imagen --------- */
  const prefijoDominante = (arr = []) => {
    const freq = {}; arr.forEach(s => { const p = s.slice(0, 2).toUpperCase(); freq[p] = (freq[p] || 0) + 1 });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  };
  const imgPorPrefijo = p => p === "NG" ? imagenNacori : p === "MP" ? imagenMatape : p === "AD" ? imagenAdivino : imagenNacori;

  /* ---------------- filtros ---------------- */
  const rutasFiltradas = rutas
    .filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()))
    .filter(r => {
      if (filtro === "completas") return r.completadas >= r.total_puntos;
      if (filtro === "incompletas") return r.completadas < r.total_puntos;
      return true;
    })
    .filter(r => {
      if (filtroPueblo === "todos") return true;
      return prefijoDominante(r.numeros_serie).toLowerCase() === filtroPueblo;
    });

  /* ---------------- paginación ---------------- */
  const totalPag = Math.ceil(rutasFiltradas.length / rutasPorPagina);
  const pageData = rutasFiltradas.slice((paginaActual - 1) * rutasPorPagina, paginaActual * rutasPorPagina);

  /* ---------------- render ---------------- */
  if (loading)
    return <div className="text-center py-8 text-gray-600 dark:text-gray-300">Cargando rutas…</div>;

  return (
    <div className="tab-rutas">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between ">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rutas para toma de lecturas</h1>
        <ModalRegistrarRuta />
        </div>
        <Button color="gray" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" /><span className="ml-2">Volver</span>
        </Button>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        {/* 🔍 Buscador */}
        <div className="relative w-full md:w-1/3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <SearchIcon className="w-5 h-5" />
          </span>
          <input
            className="pl-10 pr-8 py-2 w-full rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-neutral-800 dark:text-white"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPagina(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300">
              ✕
            </button>
          )}
        </div>



        {/* 🏠 Pueblo + estado */}
        <div className="flex gap-4">
          {/* 📆 Selector de periodo */}
          <Select
            className="border rounded-xl dark:border-gray-500 w-[110px] md:w-[200px]"
            label="Periodo"
            selectedKeys={[periodoSel || periodoActual]}
            onChange={e => { setPeriodoSel(e.target.value); setPagina(1); }}
          >
            {opcionesPeriodo.map(o => (
              <SelectItem key={o.val} value={o.val}>{o.label}</SelectItem>
            ))}
          </Select>
          <Select
            className="border rounded-xl dark:border-gray-500 w-[100px] md:w-[150px]"
            label="Pueblo"
            selectedKeys={[filtroPueblo]}
            onChange={e => { setPueblo(e.target.value); setPagina(1); }}
          >
            <SelectItem key="todos" value="todos">Todos</SelectItem>
            <SelectItem key="ng" value="ng">Nácori</SelectItem>
            <SelectItem key="mp" value="mp">Matapé</SelectItem>
            <SelectItem key="ad" value="ad">Adivino</SelectItem>
          </Select>

          <div className="flex items-center gap-2">
            <Select
              className="border rounded-xl dark:border-gray-500 w-[150px]"
              label="Estado"
              selectedKeys={[filtro]}
              onChange={e => { setFiltro(e.target.value); setPagina(1); }}
            >
              <SelectItem key="todos" value="todos">Todos</SelectItem>
              <SelectItem key="completas" value="completas">Completas</SelectItem>
              <SelectItem key="incompletas" value="incompletas">Incompletas</SelectItem>
            </Select>

          </div>
        </div>

        
      </div>

      {/* Grid de rutas */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {pageData.map(r => {
            const pref = prefijoDominante(r.numeros_serie);
            return (
              <RutaCard
                key={r.id}
                ruta={{ ...r, imagen: imgPorPrefijo(pref) }}
              />
            );
          })}
        </div>

        {rutasFiltradas.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
            No se encontraron rutas con ese criterio.
          </p>
        )}

        {/* Paginación */}
        {totalPag > 1 && (
          <div className="mt-6 flex justify-center items-center gap-4">
            <button onClick={() => setPagina(p => p - 1)} disabled={paginaActual === 1}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50">
              ← Anterior
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {paginaActual} de {totalPag}
            </span>
            <button onClick={() => setPagina(p => p + 1)} disabled={paginaActual === totalPag}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}




