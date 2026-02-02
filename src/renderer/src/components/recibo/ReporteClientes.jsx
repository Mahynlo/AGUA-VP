import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// --- ICONOS SVG (Inline para impresión segura) ---
const ChartIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>;
const LocationIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;

const ReporteClientesCompleto = () => {
    const [searchParams] = useSearchParams();
    const [clientes, setClientes] = useState([]);
    const [isReady, setIsReady] = useState(false);

    // --- 1. CARGA DE DATOS ---
    useEffect(() => {
        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                const parsed = JSON.parse(decodeURIComponent(dataParam));
                setClientes(parsed);
            } catch (e) { console.error(e); }
        } else {
            // Mock Data para pruebas visuales
            const mock = Array(40).fill(null).map((_, i) => {
                const ciudades = ["VILLA PESQUEIRA", "MAZATÁN", "SAN PEDRO DE LA CUEVA"];
                return {
                    id: 100 + i,
                    nombre: `CLIENTE EJEMPLO ${i + 1}`,
                    ciudad: ciudades[Math.floor(Math.random() * ciudades.length)],
                    direccion: `CALLE CONOCIDA #${i}`,
                    estado_cliente: Math.random() > 0.1 ? "Activo" : "Inactivo",
                    tarifa: Math.random() > 0.8 ? "Comercial" : "Doméstica",
                    telefono: "6621234567"
                };
            });
            setClientes(mock);
        }
        setIsReady(true);
    }, [searchParams]);

    // --- 2. PROCESAMIENTO DE DATOS (Agrupaciones y Estadísticas) ---
    const reporte = useMemo(() => {
        if (clientes.length === 0) return null;

        const total = clientes.length;
        const activos = clientes.filter(c => c.estado_cliente === "Activo").length;
        const inactivos = total - activos;

        // Agrupación por Ciudad
        const porCiudad = clientes.reduce((acc, curr) => {
            const ciudad = curr.ciudad || "SIN CIUDAD";
            if (!acc[ciudad]) acc[ciudad] = [];
            acc[ciudad].push(curr);
            return acc;
        }, {});

        // Estadísticas por Ciudad para gráficas
        const statsCiudad = Object.keys(porCiudad).map(ciudad => ({
            nombre: ciudad,
            cantidad: porCiudad[ciudad].length,
            porcentaje: (porCiudad[ciudad].length / total) * 100
        })).sort((a, b) => b.cantidad - a.cantidad);

        // Estadísticas por Tarifa
        const tarifas = clientes.reduce((acc, curr) => {
            const t = curr.tarifa || "NO DEFINIDA";
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, {});

        const statsTarifa = Object.keys(tarifas).map(k => ({
            nombre: k,
            cantidad: tarifas[k],
            porcentaje: (tarifas[k] / total) * 100
        }));

        return { total, activos, inactivos, porCiudad, statsCiudad, statsTarifa };
    }, [clientes]);

    const getFecha = () => new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

    if (!isReady || !reporte) return <div>Generando reporte...</div>;

    return (
        <>
            <style>
                {`
                    @media print {
                        @page { size: letter; margin: 1cm; }
                        
                        /* RESET COMPLETO DE ESTILOS DE IMPRESIÓN */
                        *, *::before, *::after {
                            background-color: transparent !important;
                            color: black !important;
                            box-shadow: none !important;
                            text-shadow: none !important;
                        }

                        /* FONDO BLANCO ABSOLUTO */
                        html, body, #root, .min-h-screen { 
                            background-color: white !important; 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important;
                        }

                        /* RESTAURAR COLORES NECESARIOS */
                        .bg-blue-50 { background-color: #eff6ff !important; }
                        .bg-green-50 { background-color: #f0fdf4 !important; }
                        .bg-red-50 { background-color: #fef2f2 !important; }
                        .bg-gray-100 { background-color: #f3f4f6 !important; }
                        .bg-blue-600 { background-color: #2563eb !important; color: white !important; }
                        .bg-purple-600 { background-color: #9333ea !important; color: white !important; }
                        
                        /* UTILIDADES DE PAGINACIÓN */
                        .no-break { break-inside: avoid; page-break-inside: avoid; }
                        .salto-pagina { break-before: page; }
                    }
                `}
            </style>

            <div className="min-h-screen bg-white p-8 font-sans text-gray-800">

                {/* === HEADER === */}
                <div className="flex justify-between items-end border-b-4 border-blue-900 pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-blue-900 uppercase">Reporte General de Clientes</h1>
                        <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Padrón de Usuarios y Distribución</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase">Fecha de Corte</div>
                        <div className="font-bold text-lg">{getFecha()}</div>
                    </div>
                </div>

                {/* === SECCIÓN 1: RESUMEN EJECUTIVO (KPIs) === */}
                <div className="grid grid-cols-3 gap-6 mb-8 no-break">
                    <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-600">
                        <p className="text-xs font-bold text-blue-500 uppercase">Total Padrón</p>
                        <p className="text-3xl font-black text-blue-900">{reporte.total}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-600">
                        <p className="text-xs font-bold text-green-600 uppercase">Usuarios Activos</p>
                        <p className="text-3xl font-black text-green-900">{reporte.activos}</p>
                        <p className="text-[10px] text-green-600 font-bold mt-1">
                            {((reporte.activos / reporte.total) * 100).toFixed(1)}% del total
                        </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border-l-4 border-red-500">
                        <p className="text-xs font-bold text-red-500 uppercase">Inactivos / Bajas</p>
                        <p className="text-3xl font-black text-red-900">{reporte.inactivos}</p>
                    </div>
                </div>

                {/* === SECCIÓN 2: GRÁFICAS DE DISTRIBUCIÓN (CSS PRINT-SAFE) === */}
                <div className="grid grid-cols-2 gap-8 mb-8 no-break">

                    {/* Gráfica por Ciudad */}
                    <div className="border border-gray-200 rounded-xl p-5">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                            <LocationIcon /> Distribución por Zona
                        </h3>
                        <div className="space-y-3">
                            {reporte.statsCiudad.map((ciudad, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                        <span>{ciudad.nombre}</span>
                                        <span>{ciudad.cantidad} ({ciudad.porcentaje.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full print:bg-blue-600"
                                            style={{ width: `${ciudad.porcentaje}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gráfica por Tarifa */}
                    <div className="border border-gray-200 rounded-xl p-5">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2 border-b pb-2">
                            <ChartIcon /> Tipos de Tarifa
                        </h3>
                        <div className="space-y-4 pt-2">
                            {reporte.statsTarifa.map((t, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-24 text-xs font-bold text-gray-600 text-right">{t.nombre}</div>
                                    <div className="flex-1 bg-gray-100 h-6 rounded overflow-hidden relative">
                                        <div
                                            className="bg-purple-600 h-full flex items-center px-2 text-[10px] text-white font-bold whitespace-nowrap"
                                            style={{ width: `${Math.max(t.porcentaje, 10)}%` }} // Min width para texto
                                        >
                                            {t.cantidad}
                                        </div>
                                    </div>
                                    <div className="w-10 text-xs text-gray-400">{t.porcentaje.toFixed(0)}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* === SECCIÓN 3: LISTADO DETALLADO AGRUPADO === */}
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase border-l-4 border-gray-800 pl-3">
                        Detalle de Usuarios por Zona
                    </h2>

                    {Object.entries(reporte.porCiudad).map(([ciudad, listaClientes], index) => (
                        <div key={index} className="mb-8 no-break">
                            {/* Cabecera de Grupo */}
                            <div className="bg-gray-100 p-2 rounded-t-lg flex justify-between items-center border border-gray-200 border-b-0">
                                <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                    <LocationIcon /> {ciudad}
                                </h3>
                                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-600 border border-gray-200">
                                    {listaClientes.length} usuarios
                                </span>
                            </div>

                            {/* Tabla del Grupo */}
                            <table className="w-full text-left text-xs border-collapse border border-gray-200">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="p-2 border-b w-16 text-center">ID</th>
                                        <th className="p-2 border-b">Nombre del Cliente</th>
                                        <th className="p-2 border-b">Dirección</th>
                                        <th className="p-2 border-b w-24">Tarifa</th>
                                        <th className="p-2 border-b w-24 text-center">Teléfono</th>
                                        <th className="p-2 border-b w-20 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaClientes.map((cliente) => (
                                        <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-2 text-center font-mono text-gray-400">{cliente.id}</td>
                                            <td className="p-2 font-bold text-gray-700">{cliente.nombre}</td>
                                            <td className="p-2 text-gray-500 truncate max-w-[200px]">{cliente.direccion}</td>
                                            <td className="p-2 text-gray-600">{cliente.tarifa}</td>
                                            <td className="p-2 text-center font-mono text-gray-500">{cliente.telefono || "-"}</td>
                                            <td className="p-2 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cliente.estado_cliente === 'Activo'
                                                    ? 'text-green-700 bg-green-50'
                                                    : 'text-red-700 bg-red-50'
                                                    }`}>
                                                    {cliente.estado_cliente?.toUpperCase().substring(0, 1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 w-full bg-white pt-2 pb-4 px-8 border-t text-[10px] text-gray-400 flex justify-between">
                    <span>Sistema AGUA VP • Reporte Confidencial</span>
                    <span>Página generada el {new Date().toLocaleString()}</span>
                </div>

            </div>
        </>
    );
};

export default ReporteClientesCompleto;