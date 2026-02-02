import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// --- ICONOS ---
const MapIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);

// --- DEFINICIÓN DE ANCHOS DE COLUMNA ---
// Ajustados para que quepan 6 columnas perfectamente
const COLS = {
    idx: "w-8",
    info: "flex-1",
    medidor: "w-24", // Reducido un poco para dar espacio
    anterior: "w-16",
    actual: "w-24",
    diferencia: "w-20" // Nueva columna
};

const ReporteLecturas = () => {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState([]);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            const dataParam = searchParams.get('data');
            const dataKey = searchParams.get('dataKey'); // Nuevo método IPC
            const useStorage = searchParams.get('useStorage'); // Legacy

            if (dataKey) {
                try {
                    // Cargar datos desde el Main Process (FileSystem/Memoria)
                    const datos = await window.api.getPrintData(dataKey);
                    if (datos) {
                        // Si recibimos un string JSON, lo parseamos
                        const parsed = typeof datos === 'string' ? JSON.parse(datos) : datos;
                        setData(parsed);
                    }
                } catch (error) {
                    console.error("Error cargando datos por IPC:", error);
                }
            } else if (dataParam) {
                try {
                    setData(JSON.parse(decodeURIComponent(dataParam)));
                } catch (error) { console.error(error); }
            } else if (useStorage) {
                try {
                    const stored = localStorage.getItem('reporte_lecturas_data');
                    if (stored) setData(JSON.parse(stored));
                } catch (error) { console.error(error); }
            } else {
                // Mock Data
                const mock = Array(10).fill(null).map((_, i) => ({
                    id: 1000 + i,
                    nombre: `CLIENTE DE PRUEBA ${i + 1}`,
                    direccion: `CALLE CONOCIDA #${i + 10}, COLONIA CENTRO`,
                    medidor: { numero_serie: `M-${5000 + i}`, ubicacion: "FACHADA" },
                    lectura_anterior: 1200 + (i * 10)
                }));
                setData(mock);
            }
            setIsReady(true);
        };

        cargarDatos();
    }, [searchParams]);

    const getFecha = () => new Date().toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });

    const isGrouped = data.length > 0 && data[0].clientes;
    const totalRegistros = isGrouped
        ? data.reduce((acc, g) => acc + (g.clientes?.length || 0), 0)
        : data.length;

    if (!isReady) return <div>Cargando...</div>;

    // --- COMPONENTE HEADER DE TABLA ---
    const TableHeader = () => (
        <div className="flex items-center bg-blue-800 text-white text-[9px] uppercase font-bold py-1.5 px-0 rounded-t-sm border border-blue-900 mb-0 print:bg-blue-800 print:text-white">
            <div className={`${COLS.idx} text-center border-r border-blue-700`}>#</div>
            <div className={`${COLS.info} px-2 border-r border-blue-700`}>Cliente / Dirección</div>
            <div className={`${COLS.medidor} px-2 border-r border-blue-700`}>Medidor</div>
            <div className={`${COLS.anterior} text-center border-r border-blue-700`}>Lec. Ant.</div>
            <div className={`${COLS.diferencia} text-center border-r border-blue-700`}>Diferencia</div>
            <div className={`${COLS.actual} text-center border-r border-blue-700`}>Lec. Actual</div>
        </div>
    );

    // --- COMPONENTE FILA (ROW) ---
    const RowItem = ({ item, idx }) => {
        const nombre = item.nombre || item.cliente || "Sin Nombre";
        const medidorObj = typeof item.medidor === 'object' ? item.medidor : null;
        const serie = medidorObj ? (medidorObj.serie || medidorObj.numero_serie) : (item.medidor || "S/N");
        const ubicacion = medidorObj?.ubicacion || item.direccion || "Sin ubicación";

        const lectAntObj = typeof item.lectura_anterior === 'object' ? item.lectura_anterior : null;
        const consumoAnt = lectAntObj?.consumo_registrado;

        return (
            <div className="flex items-stretch border-b border-x border-gray-300 bg-white text-black text-[9px] hover:bg-gray-50 break-inside-avoid">

                {/* 1. ÍNDICE */}
                <div className={`${COLS.idx} flex justify-center items-center border-r border-gray-100 bg-gray-50 text-gray-500 font-bold`}>
                    {idx + 1}
                </div>

                {/* 2. USUARIO */}
                <div className={`${COLS.info} px-2 py-1.5 flex flex-col justify-center border-r border-gray-400 overflow-hidden`}>
                    <span className="font-extrabold text-gray-900 uppercase truncate leading-tight text-[10px]">
                        {nombre}
                    </span>
                    <div className="flex items-center gap-1 text-[8px] text-gray-500 mt-0.5 truncate">
                        <MapIcon />
                        <span className="uppercase">{ubicacion}</span>
                    </div>
                </div>

                {/* 3. MEDIDOR */}
                <div className={`${COLS.medidor} px-2 py-1 border-r border-gray-400 flex flex-col justify-center bg-gray-50/30`}>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 uppercase text-[7px]">Serie:</span>
                        <span className="font-mono font-bold text-black truncate ml-1">{serie}</span>
                    </div>
                </div>

                {/* 4. ANTERIOR */}
                <div className={`${COLS.anterior} flex flex-col justify-center items-center border-r border-gray-400 bg-blue-50/20`}>
                    <span className="font-mono text-[10px] font-bold text-blue-900">
                        {consumoAnt === null ? "" : consumoAnt}
                        <span className="text-[6px] text-blue-800/60 leading-none">m³</span>
                    </span>

                </div>

                {/* 6. DIFERENCIA (Espacio escritura/cálculo) */}
                <div className={`${COLS.diferencia} border-r border-gray-400 relative bg-blue-50/20`}>
                    {/* Espacio en blanco para que escriban la resta */}
                </div>

                {/* 5. ACTUAL (Espacio escritura) */}
                <div className={`${COLS.actual} border-r border-gray-400 relative bg-blue-50/20`}>
                    <div className="absolute bottom-0.5 right-1 text-[7px] text-gray-700 select-none">m³</div>
                </div>

            </div>
        );
    }

    return (
        <>
            <style>
                {`
                    @media print {
                        @page { size: letter; margin: 0.8cm; }
                        
                        /* RESET TOTAL DE COLORES */
                        *, *::before, *::after {
                            background-color: transparent !important;
                            color: black !important;
                            box-shadow: none !important;
                            text-shadow: none !important;
                        }

                        /* FONDO BLANCO SOLIDO */
                        html, body, #root, .min-h-screen {
                            background-color: white !important;
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                        }

                        /* RESTAURAR COLORES ESPECIFICOS QUE SÍ QUEREMOS (Encabezados, tablas) */
                        .bg-blue-800 { background-color: #1e40af !important; color: white !important; }
                        .text-white { color: white !important; }
                        .bg-gray-100 { background-color: #f3f4f6 !important; }
                        .bg-gray-50 { background-color: #f9fafb !important; }
                        .border-blue-800 { border-color: #1e40af !important; }
                        
                        /* EVITAR SALTOS */
                        .break-inside-avoid { break-inside: avoid; }
                    }
                `}
            </style>

            <div className="min-h-screen bg-white p-6 print:p-0 font-sans text-black">

                {/* --- HEADER GENERAL --- */}
                <div className="flex justify-between items-end border-b-2 border-blue-800 pb-2 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-800 text-white font-bold p-2.5 rounded text-xl leading-none">VP</div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 uppercase leading-none">Toma de Lecturas</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-1">Reporte Operativo de Campo</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase mb-0.5">Emisión</p>
                        <p className="font-bold text-sm leading-none">{getFecha()}</p>
                    </div>
                </div>

                {/* --- CONTENIDO TABULAR --- */}
                <div className="flex flex-col gap-6">
                    {isGrouped ? (
                        data.map((grupo, gIdx) => (
                            <div key={gIdx} className="break-inside-avoid">
                                {/* Header del Grupo (Localidad) */}
                                <div className="flex justify-between items-end mb-1 px-1">
                                    <h3 className="font-bold text-blue-900 uppercase text-sm tracking-wide flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                                        {grupo.localidad}
                                    </h3>
                                    <span className="text-[9px] text-gray-500 font-mono">
                                        {grupo.clientes?.length || 0} Registros
                                    </span>
                                </div>

                                {/* TABLA COMPLETA */}
                                <div className="shadow-sm">
                                    <TableHeader />
                                    <div className="border-b border-gray-200">
                                        {grupo.clientes.map((cliente, cIdx) => (
                                            <RowItem key={cIdx} item={cliente} idx={cIdx} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // MODO PLANO
                        <div className="shadow-sm">
                            <TableHeader />
                            <div className="border-b border-gray-200">
                                {data.map((cliente, idx) => (
                                    <RowItem key={idx} item={cliente} idx={idx} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FOOTER --- */}
                <div className="mt-8 text-center pt-4 border-t border-dashed border-gray-300">
                    <div className="flex justify-between text-[8px] text-gray-400 uppercase">
                        <span>Sistema Agua VP v2.0</span>
                        <span>{totalRegistros} Tomas listadas</span>
                        <span>Página generada automáticamente</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReporteLecturas;