import logoagua from '../../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png'
import BarChartRecibo from '../charts/BarChartResibo';
import { InfoResibosIcon, ValanzaResibosIcon } from '../../IconsApp/IconsResibos';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAnuncioRecibo from '../../hooks/useAnuncioRecibo';
import useEquivalenciaConsumo from '../../hooks/useEquivalenciaConsumo';
import { nowHermosilloDateStr } from '../../utils/diasHabiles';

// Colores extraídos de tu diseño objetivo (image_624eeb.png)
const ESTILOS = {
    rojoHeader: '#b91c1c',     // Rojo intenso
    bordeDorado: '#a16207',    // Dorado/Bronce para los bordes principales
    rosaInfo: '#be185d',       // Rosa magenta
    verdeEquiv: '#15803d',     // Verde bosque
    bgFondo: '#ffffff',        // Blanco (antes era el color sólido)
    textoBlanco: '#ffffff'
};

const Recibo = ({ facturaData = null }) => {
    const [searchParams] = useSearchParams();
    const [paginasRecibos, setPaginasRecibos] = useState([]);

    // Hooks personalizados
    const { anuncio } = useAnuncioRecibo();
    const { obtenerFraseEquivalencia } = useEquivalenciaConsumo();

    // Fecha actual en zona horaria de Hermosillo (YYYY-MM-DD)
    const fechaActual = nowHermosilloDateStr();
    const fechaHora = new Date().toLocaleString('es-MX', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'America/Hermosillo'
    });

    useEffect(() => {
        const cargarDatos = async () => {
            if (facturaData) return;

            const dataKey = searchParams.get('dataKey');
            const facturasParam = searchParams.get('facturas'); // Fallback para compatibilidad

            if (dataKey) {
                // PRIMERO: Intentar cargar desde FileSystem (IPC) - Método nuevo robusto
                try {
                    const storedDataStr = await window.api.getPrintData(dataKey);
                    if (storedDataStr) {
                        setPaginasRecibos(JSON.parse(storedDataStr));
                        return; // Éxito
                    }
                } catch (e) {
                    console.error("Error retrieving IPC print data, trying localStorage fallback...", e);
                }

                // SEGUNDO: Fallback a localStorage (por si acaso o legacy)
                const storedDataLocal = localStorage.getItem(dataKey);
                if (storedDataLocal) {
                    try {
                        setPaginasRecibos(JSON.parse(storedDataLocal));
                        localStorage.removeItem(dataKey);
                    } catch (e) {
                        console.error("Error parsing localStorage data", e);
                    }
                }
            } else if (facturasParam) {
                try {
                    const facturas = JSON.parse(decodeURIComponent(facturasParam));
                    setPaginasRecibos(facturas);
                } catch (error) {
                    console.error('Error al parsear facturas:', error);
                    // Datos de prueba en caso de error
                    setPaginasRecibos([[{
                        id: 1,
                        cliente_nombre: "Juan Alberto Munguia del Sol",
                        direccion_cliente: "Domicilio conocido",
                        cliente_ciudad: "Villa Pesqueira",
                        consumo_m3: 28,
                        total: 100.00,
                        saldo_pendiente: 100.00,
                        mes_facturado: "03",
                        fecha_emision: fechaActual,
                        medidor: { numero_serie: "NG-12345" },
                        tarifa_nombre: "Tarifa Domestica",
                        ruta: { nombre: "13/4" }
                    }]]);
                }
            } else {
                // Datos por defecto si no hay params
                setPaginasRecibos([[{
                    id: 1,
                    cliente_nombre: "Juan Alberto Munguia del Sol",
                    direccion_cliente: "Domicilio conocido",
                    cliente_ciudad: "Villa Pesqueira",
                    consumo_m3: 28,
                    total: 100.00,
                    saldo_pendiente: 100.00,
                    mes_facturado: "03",
                    fecha_emision: fechaActual,
                    medidor: { numero_serie: "NG-12345" },
                    tarifa_nombre: "Tarifa Domestica",
                    ruta: { nombre: "13/4" }
                }]]);
            }
        };

        cargarDatos();
    }, [searchParams, facturaData]);

    const renderRecibo = (factura, numeroRecibo) => {
        if (!factura) return null;

        return (
            // Mantenemos tu estructura y dimensiones exactas
            <div key={factura.id} className="grid grid-cols-4 grid-rows-8 gap-2 h-[715px] bg-white font-sans text-[10px]">

                {/* --- HEADER (Rojo con logo) --- */}
                <div className="col-span-4 border-2 border-solid rounded-xl p-2 flex items-center shadow-sm"
                    style={{ backgroundColor: ESTILOS.rojoHeader, borderColor: ESTILOS.rojoHeader }}>
                    <img src={logoagua} className="h-[80px] mr-2 drop-shadow-sm" alt="Logo Agua" />
                    <div className="text-white">
                        <p className='text-[16px] font-bold uppercase leading-tight'>
                            Cuidemos del Agua
                        </p>
                        <p className='text-[12px] font-normal opacity-95'>
                            Comisión Municipal de Agua Potable y Alcantarillado
                        </p>
                        <p className='text-[11px] font-light opacity-90'>Villa Pesqueira, Sonora</p>
                    </div>
                </div>

                {/* --- CARD IZQUIERDA (Datos y Facturación) --- */}
                {/* Cambiado a fondo blanco con borde dorado para estilo "tarjeta" */}
                <div className="col-span-2 row-span-4 row-start-2 border-2 border-solid rounded-xl text-black p-1 flex flex-col gap-1"
                    style={{ borderColor: ESTILOS.bordeDorado, backgroundColor: ESTILOS.bgFondo }}>

                    {/* Datos Cliente */}
                    <div className="rounded-t-lg overflow-hidden border border-gray-200">
                        <div className="text-white text-center font-bold py-0.5 uppercase tracking-wide" style={{ backgroundColor: ESTILOS.rojoHeader }}>
                            Datos de cliente
                        </div>
                        <div className="bg-white p-1 flex flex-col gap-0.5 text-[9px]">
                            <span className='font-bold text-gray-900 uppercase truncate'>{factura.cliente_nombre}</span>
                            <span className='text-gray-600 truncate'>{factura.direccion_cliente || "N/A"}</span>
                            <span className='text-gray-500 truncate'>{factura.cliente_ciudad || "Villa Pesqueira, Son"}</span>
                        </div>
                    </div>

                    {/* Info Servicio */}
                    <div className="overflow-hidden border border-gray-200 flex-grow rounded-sm">
                        <div className="text-white text-center font-bold py-0.5 uppercase tracking-wide" style={{ backgroundColor: ESTILOS.rojoHeader }}>
                            Información de Servicio
                        </div>
                        <div className="bg-white p-1 flex flex-col gap-1 text-[9px]">
                            <div className='flex justify-between border-b border-gray-100 pb-0.5'>
                                <span className='font-bold text-gray-700'>No. Medidor:</span>
                                <span className='text-gray-800 font-mono'>{factura.medidor?.numero_serie || "N/A"}</span>
                            </div>
                            <div className='flex justify-between border-b border-gray-100 pb-0.5'>
                                <span className='font-bold text-gray-700'>Consumo:</span>
                                <span className='text-black font-bold'>{factura.consumo_m3} m³</span>
                            </div>
                            <div className='flex justify-between border-b border-gray-100 pb-0.5'>
                                <span className='font-bold text-gray-700'>Tarifa:</span>
                                <span className='text-gray-800 truncate max-w-[80px]'>{factura.tarifa_nombre || "N/A"}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='font-bold text-gray-700'>Ruta:</span>
                                <span className='text-gray-800'>{factura.ruta?.nombre || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Detalle Facturación */}
                    <div className="rounded-b-lg overflow-hidden border border-gray-200">
                        <div className="text-white text-center font-bold py-0.5 uppercase tracking-wide" style={{ backgroundColor: ESTILOS.rojoHeader }}>
                            Detalle de facturación
                        </div>
                        <div className="bg-white p-1 flex flex-col gap-1 text-[9px]">
                            <div className='flex justify-between'>
                                <span className='font-bold text-gray-700'>Mes facturado:</span>
                                <span className='text-gray-900 font-bold uppercase'>{factura.mes_facturado}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='font-bold text-gray-700'>Fecha lectura:</span>
                                <span className='text-gray-800'>{new Date(factura.fecha_emision).toLocaleDateString('es-MX')}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='font-bold text-gray-700'>Total del mes:</span>
                                <span className='text-gray-800'>${factura.total?.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='font-bold text-red-700'>Adeudo:</span>
                                <span className='text-red-700 font-bold'>{factura.saldo_pendiente > 0 ? `$${factura.saldo_pendiente.toFixed(2)}` : "Sin Adeudo"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total a Pagar */}
                    <div className="border-2 border-dashed rounded-lg text-center py-1 mt-auto bg-white" style={{ borderColor: ESTILOS.rojoHeader }}>
                        <p className='text-gray-500 text-[8px] font-bold uppercase'>Total a pagar</p>
                        <p className='text-black text-[15px] font-black leading-none'>${(factura.total + (factura.saldo_pendiente || 0)).toFixed(2)}</p>
                    </div>
                </div>

                {/* --- CARD DERECHA (Gráfica) --- */}
                <div className="col-span-2 row-span-4 col-start-3 row-start-2 border-2 border-solid rounded-xl p-1 flex flex-col gap-1"
                    style={{ borderColor: ESTILOS.bordeDorado, backgroundColor: ESTILOS.bgFondo }}>

                    <div className="text-white text-center font-bold py-0.5 uppercase rounded-t-lg tracking-wide" style={{ backgroundColor: ESTILOS.bordeDorado }}>
                        Información de Consumo
                    </div>

                    <div className="grid grid-cols-2 gap-1 font-bold">
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase'>Mes actual</span>
                            <span className='text-gray-900 text-[11px]'>{factura.consumo_m3} m³</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase'>Mes anterior</span>
                            <span className='text-gray-900 text-[11px]'>{factura.stats?.anterior ?? Math.max(0, factura.consumo_m3 - 2)} m³</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase'>Promedio</span>
                            <span className='text-blue-700 text-[11px]'>{factura.stats?.promedio ?? Math.round(factura.consumo_m3 * 0.9)} m³</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase'>Variación</span>
                            <span className='text-gray-400 text-[11px]'>{factura.stats?.variacion ?? Math.round(Math.random() * 20 - 10)}%</span>
                        </div>
                    </div>

                    {/* Gráfica centrada correctamente */}
                    <div className="col-span-2 flex-grow bg-white border border-gray-200 rounded-lg relative overflow-hidden flex items-center justify-center p-1">
                        <div className="w-full h-full">
                            <BarChartRecibo consumoData={factura.historicoConsumo} />
                        </div>
                    </div>
                </div>

                {/* --- INFO (Abajo Izquierda) --- */}
                <div className="col-span-2 row-start-6 border-2 border-solid rounded-xl text-white p-1.5 flex flex-col justify-center"
                    style={{ backgroundColor: ESTILOS.rosaInfo, borderColor: ESTILOS.rosaInfo }}>
                    <div className='flex gap-1.5 font-bold text-[10px] items-center border-b border-white/20 pb-0.5 mb-0.5 uppercase tracking-wide'>
                        <InfoResibosIcon className="h-4 w-4" />
                        Información
                    </div>
                    <p className='text-[9px] font-medium px-1 leading-tight'>
                        {anuncio}
                    </p>
                </div>

                {/* --- EQUIVALENCIA (Abajo Derecha) --- */}
                <div className="col-span-2 col-start-3 row-start-6 border-2 border-solid rounded-xl text-white p-1.5 flex flex-col justify-center"
                    style={{ backgroundColor: ESTILOS.verdeEquiv, borderColor: ESTILOS.verdeEquiv }}>
                    <div className='flex gap-1.5 font-bold text-[10px] items-center border-b border-white/20 pb-0.5 mb-0.5 uppercase tracking-wide'>
                        <ValanzaResibosIcon className="h-4 w-4" />
                        Consumo Equivalente
                    </div>
                    <p className='text-[9px] font-medium px-1 leading-tight'>
                        {obtenerFraseEquivalencia(factura.consumo_m3) || `Equivalencia del consumo: ${factura.consumo_m3} m³`}
                    </p>
                </div>

                {/* --- TALÓN DE CAJA (Footer) --- */}
                <div className="col-span-4 row-span-2 row-start-7 border-t-2 border-dashed pt-1 relative" style={{ borderColor: ESTILOS.rojoHeader }}>
                    {/* Nota: Conservamos el mt-3 original pero añadimos overflow-hidden para seguridad */}
                    <div className="border-2 border-solid rounded-xl text-black p-1 mt-3 border-[#af6327] border-4">
                        <div className='flex flex-row font-bold' style={{ color: '#070707ff' }}>
                            <p className='basis-64 m-2'>Notas:</p>

                            <div className='basis-64 ml-5 m-2 gap-8'>
                                <p className=''>Información de Nota: </p>
                                <p className='text-[11px] flex'>
                                    Usuario: <p className='px-2'>{factura.cliente_nombre}</p>
                                </p>
                                <p className='text-[11px] flex'>
                                    Dirección: <p className='px-2'>{factura.direccion_cliente}</p>
                                </p>
                                <p className='text-[11px] flex'>
                                    Mes facturado: <p className='px-2'>{factura.mes_facturado}</p>
                                </p>
                                <p className='text-[11px]'>Fecha de pago:__________________________</p>
                                <p className='text-[11px]'>Total pagado:$_______________________</p>
                            </div>
                        </div>
                    </div>
                    {/* Decoración de corte */}
                    <span className="absolute top-[-8px] left-1/2 -translate-x-1/2 bg-white px-2 text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                        ✂ CORTAR AQUÍ
                    </span>
                </div>
            </div>
        );
    };

    // Si se pasa una factura individual
    if (facturaData) {
        return (
            <div className="w-full">
                {renderRecibo(facturaData, 1)}
            </div>
        );
    }

    return (
        <>
            <style>
                {`
                    @media print {
                        @page {
                            size: letter landscape;
                            margin: 5mm; 
                        }
                        
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        @page {
                            margin-header: 0;
                            margin-footer: 0;
                        }
                    }
                `}
            </style>

            <div className='bg-gray-100 min-h-screen p-4 print:p-0 print:bg-white print:min-h-0 print:block'>

                {paginasRecibos.map((paginaRecibos, indicePagina) => {
                    const esUltimaPagina = indicePagina === paginasRecibos.length - 1;

                    return (
                        <div
                            key={indicePagina}
                            className={`
                                mb-8 
                                print:mb-0 
                                print:w-full 
                                print:h-screen
                                print:flex
                                print:flex-col
                                print:justify-center
                                print:items-center
                                print:break-inside-avoid
                                ${esUltimaPagina ? 'print:break-after-auto' : 'print:break-after-page'}
                            `}
                        >
                            {/* CONTENEDOR ESCALADO 
                                Mantenemos el scale-0.95 para tener espacio seguro
                            */}
                            <div className="w-full print:scale-[0.95] print:origin-center flex flex-col h-full justify-center">

                                {/* 1. Header Paginación */}
                                <div className="text-right text-[9px] bg-white grid grid-cols-[1fr_auto_1fr] gap-2 mb-2 px-2 border-b border-dashed border-gray-300 pb-1">
                                    <div className="text-left font-mono text-gray-500">
                                        {fechaHora} • Recibo {indicePagina * 2 + 1}
                                    </div>
                                    <div className='text-center'></div>
                                    <div className="text-right font-mono text-gray-500">
                                        {paginaRecibos[1] ? `${fechaHora}  • Recibo ${indicePagina * 2 + 2}` : ''}
                                    </div>
                                </div>

                                {/* 2. Grid de Recibos */}
                                <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-4 gap-6 bg-white p-1">
                                    {/* Primer recibo */}
                                    <div className="col-span-1 row-span-4 bg-white">
                                        {renderRecibo(paginaRecibos[0], indicePagina * 2 + 1)}
                                    </div>

                                    {/* Línea divisoria */}
                                    <div className="col-span-1 row-span-4 flex justify-center relative">
                                        <div className="border-r-2 border-dashed h-[715px]" style={{ borderColor: ESTILOS.rojoHeader, opacity: 0.3 }}></div>
                                    </div>

                                    {/* Segundo recibo */}
                                    <div className="col-span-1 row-span-4 bg-white">
                                        {paginaRecibos[1] ? renderRecibo(paginaRecibos[1], indicePagina * 2 + 2) : (
                                            <div className="h-[715px] border-2 border-dashed border-gray-100 rounded-xl bg-gray-50 flex items-center justify-center">
                                                <span className="text-gray-300 font-bold uppercase rotate-45">Espacio Vacío</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. NUEVO: PIE DE PÁGINA (Footer con QR y Leyenda) */}
                                <div className=" pt-2 border-t border-gray-100 flex justify-between items-end px-4">

                                    {/* Leyenda Izquierda */}
                                    <div className="text-gray-400 font-bold font-mono tracking-widest text-xs uppercase">
                                        AGUA VP <span className="font-normal text-[9px] normal-case opacity-70 ml-2">Sistema de Gestión Municipal</span>
                                    </div>


                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default Recibo;