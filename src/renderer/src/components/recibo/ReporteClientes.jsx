import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from '../../context/LogoContext';
import { useNotifyPrintReady } from '../../hooks/useNotifyPrintReady';

// --- ICONOS SVG (Inline para impresión segura) ---
const ChartIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>;
const LocationIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const TagIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>;

// --- FUNCIÓN DE ORDENAMIENTO ---
const sortClientes = (lista, campo) => {
    return [...lista].sort((a, b) => {
        if (campo === "nombre") {
            return (a.nombre || "").localeCompare(b.nombre || "");
        }
        // numero_predio: ordenamiento alfanumérico inteligente
        // Extrae prefijo y número: "NG-24" → ["NG", 24]
        const parsePredioParts = (val) => {
            if (!val) return ["", 0];
            const match = val.match(/^([A-Za-z]*)[-\/]?(\d+)$/);
            if (match) return [match[1].toUpperCase(), parseInt(match[2], 10)];
            return [val.toUpperCase(), 0];
        };
        const [prefA, numA] = parsePredioParts(a.numero_predio);
        const [prefB, numB] = parsePredioParts(b.numero_predio);
        if (prefA !== prefB) return prefA.localeCompare(prefB);
        return numA - numB;
    });
};

const ReporteClientesCompleto = () => {
    const { logoSrc } = useAppLogo();
    const [searchParams] = useSearchParams();
    const [clientes, setClientes] = useState([]);
    const [isReady, setIsReady] = useState(false);

    useNotifyPrintReady(isReady);

    // Parámetros de configuración
    const ordenarPor = searchParams.get('ordenarPor') || 'numero_predio';
    const agrupar = searchParams.get('agrupar') || 'ciudad';

    // --- 1. CARGA DE DATOS (soporta dataKey IPC y data inline) ---
    useEffect(() => {
        const cargarDatos = async () => {
            // Prioridad 1: dataKey (robusto para grandes volúmenes)
            const dataKey = searchParams.get('dataKey');
            if (dataKey && window.api && window.api.getPrintData) {
                try {
                    const raw = await window.api.getPrintData(dataKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        setClientes(Array.isArray(parsed) ? parsed : []);
                        setIsReady(true);
                        return;
                    }
                } catch (e) {
                    console.error("Error cargando datos por dataKey:", e);
                }
            }

            // Prioridad 2: data inline en URL (legacy)
            const dataParam = searchParams.get('data');
            if (dataParam) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(dataParam));
                    setClientes(parsed);
                } catch (e) { console.error(e); }
            } else {
                // Mock Data para pruebas visuales
                const mock = Array(40).fill(null).map((_, i) => {
                    const ciudades = ["NACORI GRANDE", "MATAPE", "ADIVINO"];
                    const prefijos = ["NG", "MP", "AD"];
                    const idx = Math.floor(Math.random() * 3);
                    return {
                        id: 100 + i,
                        numero_predio: `${prefijos[idx]}-${(i + 1).toString().padStart(2, '0')}`,
                        nombre: `CLIENTE EJEMPLO ${i + 1}`,
                        ciudad: ciudades[idx],
                        direccion: `CALLE CONOCIDA #${i}`,
                        estado_cliente: Math.random() > 0.1 ? "Activo" : "Inactivo",
                        tarifa: Math.random() > 0.8 ? "Comercial" : "Doméstica",
                        telefono: "6621234567"
                    };
                });
                setClientes(mock);
            }
            setIsReady(true);
        };

        cargarDatos();
    }, [searchParams]);

    // --- 2. PROCESAMIENTO DE DATOS (Agrupaciones y Estadísticas) ---
    const reporte = useMemo(() => {
        if (clientes.length === 0) return null;

        const total = clientes.length;
        const activos = clientes.filter(c => c.estado_cliente === "Activo").length;
        const inactivos = total - activos;

        // Ordenar todos los clientes
        const clientesOrdenados = sortClientes(clientes, ordenarPor);

        // Agrupación por Ciudad
        const porCiudad = clientesOrdenados.reduce((acc, curr) => {
            const ciudad = curr.ciudad || "SIN CIUDAD";
            if (!acc[ciudad]) acc[ciudad] = [];
            acc[ciudad].push(curr);
            return acc;
        }, {});

        // Agrupación por Tarifa
        const porTarifa = clientesOrdenados.reduce((acc, curr) => {
            const tarifa = curr.tarifa_nombre || curr.tarifa || "SIN TARIFA";
            if (!acc[tarifa]) acc[tarifa] = [];
            acc[tarifa].push(curr);
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
            const t = curr.tarifa_nombre || curr.tarifa || "SIN TARIFA";
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, {});

        const statsTarifa = Object.keys(tarifas).map(k => ({
            nombre: k,
            cantidad: tarifas[k],
            porcentaje: (tarifas[k] / total) * 100
        }));

        return { total, activos, inactivos, porCiudad, porTarifa, statsCiudad, statsTarifa, clientesOrdenados };
    }, [clientes, ordenarPor]);

    const getFecha = () => new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

    // --- TABLA REUTILIZABLE ---
    const TablaClientes = ({ listaClientes, mostrarCiudad = false, mostrarTarifa = true }) => (
        <table className="w-full text-left text-xs border-collapse border border-gray-200" style={{ fontSize: '10px' }}>
            <thead>
                <tr>
                    <th className="th-print-bg text-center" style={{ padding: '7px 6px', background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid rgba(255,255,255,0.18)', width: '80px' }}>N° Predio</th>
                    <th className="th-print-bg" style={{ padding: '7px 6px', background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid rgba(255,255,255,0.18)' }}>Nombre del Cliente</th>
                    <th className="th-print-bg" style={{ padding: '7px 6px', background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid rgba(255,255,255,0.18)' }}>Dirección</th>
                    {mostrarCiudad && (
                        <th className="th-print-bg" style={{ padding: '7px 6px', background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid rgba(255,255,255,0.18)', width: '110px' }}>Ciudad</th>
                    )}
                    {mostrarTarifa && (
                        <th className="th-print-bg" style={{ padding: '7px 6px', background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid rgba(255,255,255,0.18)', width: '96px' }}>Tarifa</th>
                    )}
                    <th className="th-print-bg text-center" style={{ padding: '7px 6px', background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Estado</th>
                </tr>
            </thead>
            <tbody>
                {listaClientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50" style={{ pageBreakInside: 'avoid' }}>
                        <td className="p-2 text-center font-mono font-bold text-gray-700" style={{ borderRight: '1px solid #e5e7eb', verticalAlign: 'middle' }}>
                            {cliente.numero_predio || "-"}
                        </td>
                        <td className="p-2 font-bold text-gray-700" style={{ borderRight: '1px solid #e5e7eb', verticalAlign: 'middle', textTransform: 'uppercase' }}>{cliente.nombre}</td>
                        <td className="p-2 text-gray-500 truncate max-w-[200px]" style={{ borderRight: '1px solid #e5e7eb', verticalAlign: 'middle', fontSize: '9px' }}>{cliente.direccion}</td>
                        {mostrarCiudad && (
                            <td className="p-2 text-gray-600 text-xs" style={{ borderRight: '1px solid #e5e7eb', verticalAlign: 'middle', textTransform: 'uppercase', fontSize: '9px' }}>{cliente.ciudad || "-"}</td>
                        )}
                        {mostrarTarifa && (
                            <td className="p-2 text-gray-600" style={{ borderRight: '1px solid #e5e7eb', verticalAlign: 'middle', fontSize: '9px' }}>{cliente.tarifa_nombre || cliente.tarifa || "-"}</td>
                        )}
                        <td className="p-2 text-center" style={{ verticalAlign: 'middle' }}>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cliente.estado_cliente === 'Activo'
                                ? 'text-green-700 bg-green-50'
                                : 'text-red-700 bg-red-50'
                                }`}>
                                {cliente.estado_cliente?.toUpperCase()}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    if (!isReady || !reporte) return <div>Generando reporte...</div>;

    const getDescripcionAgrupacion = () => {
        if (agrupar === "ciudad") return "Agrupado por Ciudad";
        if (agrupar === "tarifa") return "Agrupado por Tarifa";
        return "Lista General";
    };

    return (
        <>
            <style>
                {`
                    @media print {
                        @page { 
                            size: letter; 
                            margin: 1cm 1cm 1.5cm 1cm;
                        }
                        
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
                        .th-print-bg { background-color: #1e3a8a !important; color: white !important; }
                        .th-print-bg * { color: white !important; }
                        .page-header-unificado { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%) !important; color: white !important; }
                        .page-header-unificado * { color: white !important; }
                        
                        /* UTILIDADES DE PAGINACIÓN */
                        .no-break { break-inside: avoid; page-break-inside: avoid; }
                        .salto-pagina { break-before: page; }

                        /* REGLAS MAESTRAS DE TABLA */
                        thead { display: table-header-group; }
                        tfoot { display: table-footer-group; }
                        tr { page-break-inside: avoid; }

                        /* FOOTER FIJO: se repite al final de CADA hoja impresa. */
                        .doc-footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            display: flex !important;
                            justify-content: space-between;
                            align-items: center;
                            padding: 0.18cm 0.8cm;
                            border-top: 1px solid #e5e7eb !important;
                            font-size: 7pt !important;
                            color: #9ca3af !important;
                            background-color: #ffffff !important;
                            margin-top: 0 !important;
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }
                    }

                    @media screen {
                        .doc-footer { border-top: 1px solid #e5e7eb; padding: 0.5rem 0; margin-top: 1.5rem; font-size: 0.7rem; color: #9ca3af; display: flex; justify-content: space-between; }
                    }
                `}
            </style>

            <div className="reporte-clientes-doc min-h-screen bg-white p-8 font-sans text-gray-800">
                
                {/* TABLA MAESTRA PARA CONTROLAR EL FLUJO DE IMPRESIÓN */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        <tr>
                            <td>
                                {/* === HEADER CON LOGO (Estilo unificado con los demás reportes) === */}
                                <div style={{ marginBottom: '18px' }} className="no-break">
                                    {/* Franja principal */}
                                    <div className="page-header-unificado" style={{
                                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)',
                                        color: '#fff',
                                        padding: '14px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        borderRadius: '8px 8px 0 0',
                                    }}>
                                        <img src={logoSrc} alt="Escudo" style={{ height: '76px', width: '76px', objectFit: 'contain', flexShrink: 0 }} />
                                        
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
                                                Comisión Municipal de Agua Potable y Alcantarillado
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fff' }}>
                                                Villa Pesqueira, Sonora — Padrón General de Clientes
                                            </div>
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.15)',
                                            border: '1px solid rgba(255,255,255,0.35)',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            textAlign: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, color: '#fff' }}>Usuarios</div>
                                            <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px', color: '#fff' }}>
                                                {reporte.total}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Barra de título */}
                                    <div style={{
                                        background: '#f0f9ff',
                                        borderLeft: '4px solid #1e40af',
                                        borderRight: '1px solid #bfdbfe',
                                        borderBottom: '1px solid #bfdbfe',
                                        padding: '8px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderRadius: '0 0 6px 6px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Catálogo de Usuarios
                                            </span>
                                            <span style={{
                                                background: '#1e40af', color: '#fff',
                                                fontSize: '10px', fontWeight: 700,
                                                padding: '2px 10px', borderRadius: '999px',
                                            }}>
                                                {ordenarPor === "nombre" ? "Nombre" : "N° de Predio"} • {getDescripcionAgrupacion()}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280' }}>
                                            <div style={{ fontWeight: 600, color: '#374151' }}>Fecha de emisión</div>
                                            <div style={{ textTransform: 'capitalize' }}>{getFecha()}</div>
                                        </div>
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

                                {/* === SECCIÓN 2: GRÁFICAS DE DISTRIBUCIÓN === */}
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
                                                            style={{ width: `${Math.max(t.porcentaje, 10)}%` }}
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

                                {/* === SECCIÓN 3: LISTADO DETALLADO === */}
                                <div className="mt-8">
                                    {agrupar === "ciudad" ? (
                                        <>
                                            {/* MODO AGRUPADO POR CIUDAD */}
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase border-l-4 border-gray-800 pl-3">
                                                Detalle de Usuarios por Zona
                                            </h2>
                                            {Object.entries(reporte.porCiudad).map(([ciudad, listaClientes], index) => (
                                                <div key={index} className="mb-8">
                                                    <div className="bg-gray-100 p-2 rounded-t-lg flex justify-between items-center border border-gray-200 border-b-0 no-break">
                                                        <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                                            <LocationIcon /> {ciudad}
                                                        </h3>
                                                        <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-600 border border-gray-200">
                                                            {listaClientes.length} usuarios
                                                        </span>
                                                    </div>
                                                    <TablaClientes listaClientes={listaClientes} mostrarCiudad={false} mostrarTarifa={true} />
                                                </div>
                                            ))}
                                        </>
                                    ) : agrupar === "tarifa" ? (
                                        <>
                                            {/* MODO AGRUPADO POR TARIFA */}
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase border-l-4 border-gray-800 pl-3">
                                                Detalle de Usuarios por Tarifa
                                            </h2>
                                            {Object.entries(reporte.porTarifa).map(([tarifa, listaClientes], index) => (
                                                <div key={index} className="mb-8">
                                                    <div className="bg-gray-100 p-2 rounded-t-lg flex justify-between items-center border border-gray-200 border-b-0 no-break">
                                                        <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                                            <TagIcon /> {tarifa}
                                                        </h3>
                                                        <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-600 border border-gray-200">
                                                            {listaClientes.length} usuarios
                                                        </span>
                                                    </div>
                                                    <TablaClientes listaClientes={listaClientes} mostrarCiudad={true} mostrarTarifa={false} />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {/* MODO LISTA CORRIDA */}
                                            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase border-l-4 border-gray-800 pl-3">
                                                Listado General — {reporte.total} Usuarios
                                            </h2>
                                            <TablaClientes listaClientes={reporte.clientesOrdenados} mostrarCiudad={true} mostrarTarifa={true} />
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    
                    {/* FOOTER INVISIBLE PARA RESERVAR EL ESPACIO */}
                    <tfoot>
                        <tr>
                            <td>
                                {/* 45px es un buen colchón considerando que este footer es un poco más grueso por los paddings */}
                                <div style={{ height: "45px" }}></div>
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* FOOTER FIJO AL FINAL DEL DOCUMENTO */}
                <div className="doc-footer">
                    <span>Sistema AGUA VP &bull; Padrón General de Clientes</span>
                    <span>Generado el {new Date().toLocaleDateString("es-MX")}</span>
                </div>

            </div>
        </>
    );
};

export default ReporteClientesCompleto;