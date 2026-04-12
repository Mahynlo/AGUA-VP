import { useAppLogo } from '../../context/LogoContext';
import BarChartRecibo from '../charts/BarChartResibo';
import { InfoResibosIcon, ValanzaResibosIcon } from '../../IconsApp/IconsResibos';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import useAnuncioRecibo from '../../hooks/useAnuncioRecibo';
import useEquivalenciaConsumo from '../../hooks/useEquivalenciaConsumo';
import { nowHermosilloDateStr } from '../../utils/diasHabiles';

// Colores extraídos de tu diseño objetivo
const ESTILOS = {
    rojoHeader: '#b91c1c',     
    bordeDorado: '#a16207',    
    rosaInfo: '#be185d',       
    verdeEquiv: '#15803d',     
    bgFondo: '#ffffff',        
    textoBlanco: '#ffffff'
};

const formatearFecha = (value) => {
    if (!value) return 'N/A';
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const base = new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);

    const partes = base.split(' ');
    if (partes.length >= 3) {
        const mes = partes[1].replace('.', '');
        const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
        return `${partes[0]} ${mesCapitalizado} ${partes[2]}`;
    }

    return base.replace('.', '');
};

const obtenerFuenteFechaFactura = (factura) => {
    if (!factura) return null;
    return (
        factura.fecha_emision_hora ||
        factura.fecha_emision_datetime ||
        factura.fecha_creacion ||
        factura.created_at ||
        factura.fecha_emision ||
        null
    );
};

const formatearHoraGeneracionCabecera = (factura) => {
    const fuenteFecha = obtenerFuenteFechaFactura(factura);
    if (!fuenteFecha) return 'N/A';

    const tieneHora = typeof fuenteFecha === 'string' && /(\d{2}:\d{2})/.test(fuenteFecha);
    if (!tieneHora) return 'N/A';

    const match = String(fuenteFecha).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(fuenteFecha);

    if (Number.isNaN(date.getTime())) return 'N/A';

    return new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Hermosillo'
    }).format(date).toLowerCase();
};

const formatearFechaHoraEmisionCabecera = (factura) => {
    if (!factura) return 'N/A';

    const fuenteFecha = obtenerFuenteFechaFactura(factura);

    if (!fuenteFecha) return 'N/A';

    const match = String(fuenteFecha).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(fuenteFecha);

    if (Number.isNaN(date.getTime())) return 'N/A';

    const tieneHora = typeof fuenteFecha === 'string' && /(\d{2}:\d{2})/.test(fuenteFecha);
    if (!tieneHora) return formatearFecha(date);

    const hora = new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Hermosillo'
    }).format(date).toLowerCase();

    return `${formatearFecha(date)}, ${hora}`;
};

const Recibo = ({ facturaData = null }) => {
    const { logoSrc } = useAppLogo();
    const [searchParams] = useSearchParams();
    const [paginasRecibos, setPaginasRecibos] = useState([]);

    const { anuncio } = useAnuncioRecibo();
    const { obtenerFraseEquivalencia } = useEquivalenciaConsumo();

    const fechaActual = nowHermosilloDateStr();
    const fechaImpresion = new Date().toLocaleString('es-MX', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
        timeZone: 'America/Hermosillo'
    });
    useEffect(() => {
        const cargarDatos = async () => {
            if (facturaData) return;

            const dataKey = searchParams.get('dataKey');
            const facturasParam = searchParams.get('facturas'); 

            if (dataKey) {
                try {
                    const storedDataStr = await window.api.getPrintData(dataKey);
                    if (storedDataStr) {
                        setPaginasRecibos(JSON.parse(storedDataStr));
                        return;
                    }
                } catch (e) {
                    console.error("Error retrieving IPC print data", e);
                }

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
                }
            } else {
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
                    fecha_vencimiento: fechaActual,
                    medidor: { numero_serie: "NG-12345" },
                    tarifa_nombre: "Tarifa Domestica",
                    ruta: { nombre: "13/4" }
                }]]);
            }
        };

        cargarDatos();
    }, [searchParams, facturaData, fechaActual]);

    // ==========================================
    // RENDER: PARTE FRONTAL (ANVERSO)
    // ==========================================
    const renderRecibo = (factura, numeroRecibo) => {
        if (!factura) return null;

        return (
            <div key={`front-${factura.id}`} className="grid grid-cols-4 grid-rows-8 gap-2 h-[715px] bg-white font-sans text-[10px] relative">
                {/* --- HEADER --- */}
                <div className="col-span-4 border-2 border-solid rounded-xl p-2 flex items-center shadow-sm print:shadow-none"
                    style={{ backgroundColor: ESTILOS.rojoHeader, borderColor: ESTILOS.rojoHeader }}>
                    <img src={logoSrc} className="h-[80px] mr-2 drop-shadow-sm print:drop-shadow-none" alt="Logo Agua" />
                    <div className="text-white">
                        <p className='text-[16px] font-bold uppercase leading-tight'>Cuidemos del Agua</p>
                        <p className='text-[12px] font-normal opacity-95'>Comisión Municipal de Agua Potable y Alcantarillado</p>
                        <p className='text-[11px] font-light opacity-90'>Villa Pesqueira, Sonora</p>
                    </div>
                </div>

                {/* --- CARD IZQUIERDA --- */}
                <div className="col-span-2 row-span-4 row-start-2 border-2 border-solid rounded-xl text-black p-1 flex flex-col gap-1 shadow-sm print:shadow-none"
                    style={{ borderColor: ESTILOS.bordeDorado, backgroundColor: ESTILOS.bgFondo }}>
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
                                <span className='text-gray-800'>{formatearFecha(factura.fecha_lectura)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='font-bold text-gray-700'>Vencimiento:</span>
                                <span className='text-gray-800'>{formatearFecha(factura.fecha_vencimiento)}</span>
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

                    <div className="border-2 border-dashed rounded-lg text-center py-1 mt-auto bg-white" style={{ borderColor: ESTILOS.rojoHeader }}>
                        <p className='text-gray-500 text-[8px] font-bold uppercase tracking-wider'>Total a pagar</p>
                        <p className='text-black text-[15px] font-black leading-none'>${(factura.total + (factura.saldo_pendiente || 0)).toFixed(2)}</p>
                    </div>
                </div>

                {/* --- CARD DERECHA (Gráfica) --- */}
                <div className="col-span-2 row-span-4 col-start-3 row-start-2 border-2 border-solid rounded-xl p-1 flex flex-col gap-1 shadow-sm print:shadow-none"
                    style={{ borderColor: ESTILOS.bordeDorado, backgroundColor: ESTILOS.bgFondo }}>
                    <div className="text-white text-center font-bold py-0.5 uppercase rounded-t-lg tracking-wide" style={{ backgroundColor: ESTILOS.bordeDorado }}>
                        Información de Consumo
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-bold">
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase tracking-wider'>Mes actual</span>
                            <span className='text-gray-900 text-[11px]'>{factura.consumo_m3} m³</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase tracking-wider'>Mes anterior</span>
                            <span className='text-gray-900 text-[11px]'>{factura.stats?.anterior ?? Math.max(0, factura.consumo_m3 - 2)} m³</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase tracking-wider'>Promedio</span>
                            <span className='text-blue-700 text-[11px]'>{factura.stats?.promedio ?? Math.round(factura.consumo_m3 * 0.9)} m³</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className='block text-gray-400 text-[8px] uppercase tracking-wider'>Variación</span>
                            <span className='text-gray-400 text-[11px]'>{factura.stats?.variacion ?? Math.round(Math.random() * 20 - 10)}%</span>
                        </div>
                    </div>
                    <div className="col-span-2 flex-grow bg-white border border-gray-200 rounded-lg relative overflow-hidden flex items-center justify-center p-1">
                        <div className="w-full h-full">
                            <BarChartRecibo consumoData={factura.historicoConsumo} />
                        </div>
                    </div>
                </div>

                {/* --- INFO (Abajo Izquierda) --- */}
                <div className="col-span-2 row-start-6 border-2 border-solid rounded-xl text-white p-2 flex flex-col justify-center shadow-sm print:shadow-none"
                    style={{ backgroundColor: ESTILOS.rosaInfo, borderColor: ESTILOS.rosaInfo }}>
                    <div className='flex gap-1.5 font-bold text-[10px] items-center border-b border-white/20 pb-1 mb-1 uppercase tracking-wide'>
                        <InfoResibosIcon className="h-4 w-4" /> Información
                    </div>
                    <p className='text-[9px] font-medium px-1 leading-tight'>{anuncio}</p>
                </div>

                {/* --- EQUIVALENCIA (Abajo Derecha) --- */}
                <div className="col-span-2 col-start-3 row-start-6 border-2 border-solid rounded-xl text-white p-2 flex flex-col justify-center shadow-sm print:shadow-none"
                    style={{ backgroundColor: ESTILOS.verdeEquiv, borderColor: ESTILOS.verdeEquiv }}>
                    <div className='flex gap-1.5 font-bold text-[10px] items-center border-b border-white/20 pb-1 mb-1 uppercase tracking-wide'>
                        <ValanzaResibosIcon className="h-4 w-4" /> Consumo Equivalente
                    </div>
                    <p className='text-[9px] font-medium px-1 leading-tight'>
                        {obtenerFraseEquivalencia(factura.consumo_m3) || `Equivalencia: ${factura.consumo_m3} m³`}
                    </p>
                </div>

                {/* --- TALÓN DE CAJA (Footer) --- */}
                <div className="col-span-4 row-span-2 row-start-7 border-t-2 border-dashed pt-1 relative" style={{ borderColor: ESTILOS.rojoHeader }}>
                    <div className="border-2 border-solid rounded-xl text-black p-1 mt-3 border-[#af6327] border-4 bg-white print:bg-transparent shadow-sm print:shadow-none">
                        <div className='flex flex-row font-bold' style={{ color: '#070707' }}>
                            <p className='basis-64 m-2'>Notas:</p>
                            <div className='basis-64 ml-5 m-2 gap-8'>
                                <p>Información de Nota: </p>
                                <p className='text-[11px] flex'>Usuario: <span className='px-2 font-normal'>{factura.cliente_nombre}</span></p>
                                <p className='text-[11px] flex'>Dirección: <span className='px-2 font-normal'>{factura.direccion_cliente}</span></p>
                                <p className='text-[11px] flex'>Mes facturado: <span className='px-2 font-normal uppercase'>{factura.mes_facturado}</span></p>
                                <p className='text-[11px] mt-1'>Fecha de pago: __________________________</p>
                                <p className='text-[11px]'>Total pagado: $_______________________</p>
                            </div>
                        </div>
                    </div>
                    <span className="absolute top-[-8px] left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full text-[8px] text-gray-400 font-bold uppercase tracking-widest border border-gray-100 print:border-none">
                        ✂ Cortar aquí
                    </span>
                </div>
            </div>
        );
    };

    // ==========================================
    // RENDER: PARTE TRASERA (REVERSO)
    // ==========================================
    const renderReverso = (factura) => {
        if (!factura) return null;

        return (
            <div key={`back-${factura.id}`} className="grid grid-cols-4 grid-rows-8 gap-2 h-[715px] bg-white font-sans text-[10px] relative border-2 border-transparent">
                
                {/* --- ÁREA DE AVISOS Y ANUNCIOS (Ocupa exactamente las primeras 6 filas) --- */}
                <div className="col-span-4 row-span-6 border-2 border-gray-200 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden bg-gray-50/50">
                    
                    {/* Marca de agua sutil de fondo */}
                    <img src={logoSrc} alt="Watermark" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 w-64 grayscale pointer-events-none" />

                    <div className="text-center border-b-2 border-gray-200 pb-2 mb-2 z-10">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Información Importante para el Usuario</h2>
                        <p className="text-xs text-gray-500">Por favor lea cuidadosamente las siguientes indicaciones</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 flex-grow z-10 text-[10px] text-gray-700 text-justify">
                        <div className="flex flex-col gap-3">
                            <div>
                                <h3 className="font-bold text-gray-900 border-l-2 border-red-600 pl-2 mb-1">Lugares y Formas de Pago</h3>
                                <p>El pago de este recibo puede realizarse en las oficinas de la Comisión Municipal de Agua Potable y Alcantarillado ubicadas en el Palacio Municipal, así como en los establecimientos autorizados.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 border-l-2 border-red-600 pl-2 mb-1">Cargos por Reconexión</h3>
                                <p>Evite recargos. El servicio será suspendido si presenta adeudos de 2 meses o más. La reconexión causará un cargo adicional al monto vencido.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 border-l-2 border-red-600 pl-2 mb-1">Fugas y Desperdicio</h3>
                                <p>Cualquier fuga de agua al interior de su domicilio es responsabilidad del usuario. El medidor contabilizará el agua perdida incrementando el monto de su recibo.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg">
                                <h3 className="font-bold text-blue-800 mb-1">¡El agua es vida, cuídala!</h3>
                                <ul className="list-disc pl-4 space-y-1 text-blue-900">
                                    <li>Revisa periódicamente tus tuberías y empaques.</li>
                                    <li>Cierra bien las llaves después de usarlas.</li>
                                    <li>Toma duchas breves de no más de 5 minutos.</li>
                                    <li>Usa cubeta en lugar de manguera para lavar tu auto.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 border-l-2 border-red-600 pl-2 mb-1">Aclaraciones</h3>
                                <p>Si no está de acuerdo con su consumo, tiene 5 días hábiles después de la recepción de este documento para realizar cualquier aclaración en nuestras oficinas.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TALÓN DE CAJA REVERSO (Coincide exacto con la fila 7 del frente) --- */}
                {/* Usamos el mismo border-dashed y padding para que el corte sea milimétrico */}
                <div className="col-span-4 row-span-2 row-start-7 border-t-2 border-dashed pt-1 relative" style={{ borderColor: ESTILOS.rojoHeader }}>
                    <div className="h-full border-2 border-gray-200 border-dashed rounded-xl bg-gray-50/50 mt-3 flex items-center justify-center p-4">
                        <div className="text-center opacity-40">
                            <p className="text-xs font-bold uppercase tracking-widest mb-1">Espacio para Sello de Cajero</p>
                            <p className="text-[9px]">Reverso del talón de pago. No escribir en esta área.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (facturaData) {
        return <div className="w-full">{renderRecibo(facturaData, 1)}</div>;
    }

    return (
        <>
            <style>
                {`
                    @media print {
                        @page { size: letter landscape; margin: 5mm; }
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        @page { margin-header: 0; margin-footer: 0; }
                    }
                `}
            </style>

            <div className='bg-slate-50 dark:bg-black/20 min-h-screen py-8 px-4 sm:px-8 print:p-0 print:bg-white print:min-h-0 print:block flex flex-col items-center'>

                {paginasRecibos.map((paginaRecibos, indicePagina) => {
                    const esUltimaPagina = indicePagina === paginasRecibos.length - 1;
                    
                    // Lógica de cruce para impresión a doble cara (Dúplex)
                    // Al imprimir volteando por el borde corto (Short Edge), el que está a la derecha en el anverso, queda a la izquierda en el reverso.
                    const reciboIzquierdoFrente = paginaRecibos[0];
                    const reciboDerechoFrente = paginaRecibos[1];
                    const reciboIzquierdoReverso = paginaRecibos[1] || null; // Cruce
                    const reciboDerechoReverso = paginaRecibos[0];          // Cruce

                    return (
                        <React.Fragment key={indicePagina}>
                            
                            {/* =======================
                                PÁGINA 1: ANVERSO (FRENTE)
                                ======================= */}
                            <div className={`mb-10 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:mb-0 print:bg-transparent print:rounded-none print:shadow-none print:border-none print:w-full print:h-screen print:flex print:flex-col print:justify-center print:items-center print:break-inside-avoid print:break-after-page`}>
                                
                                {/* Etiqueta visible solo en pantalla */}
                                <div className="bg-blue-600 text-white text-center font-bold text-xs py-1 tracking-widest uppercase print:hidden">
                                    Hoja {indicePagina + 1} - Frente (Anverso)
                                </div>

                                <div className="w-full p-4 print:p-0 print:scale-[0.95] print:origin-center flex flex-col h-full justify-center">
                                    {/* Header Paginación */}
                                    <div className="text-right text-[9px] bg-white grid grid-cols-[1fr_auto_1fr] gap-2 mb-2 px-2 border-b border-dashed border-gray-300 pb-1">
                                        <div className="text-left font-mono text-gray-500">
                                            Fecha de emisión: {formatearFechaHoraEmisionCabecera(reciboIzquierdoFrente)} • Hora generación: {formatearHoraGeneracionCabecera(reciboIzquierdoFrente)} • Recibo {indicePagina * 2 + 1}
                                        </div>
                                        <div className="text-center font-mono text-gray-500">Fecha impresión: {fechaImpresion}</div>
                                        <div className="text-right font-mono text-gray-500">
                                            {reciboDerechoFrente ? `Fecha de emisión: ${formatearFechaHoraEmisionCabecera(reciboDerechoFrente)} • Hora generación: ${formatearHoraGeneracionCabecera(reciboDerechoFrente)} • Recibo ${indicePagina * 2 + 2}` : ''}
                                        </div>
                                    </div>

                                    {/* Grid de Recibos Frontales */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-4 gap-6 bg-white p-1">
                                        <div className="col-span-1 row-span-4 bg-white">
                                            {renderRecibo(reciboIzquierdoFrente, indicePagina * 2 + 1)}
                                        </div>

                                        {/* Línea divisoria de corte principal */}
                                        <div className="col-span-1 row-span-4 flex justify-center relative">
                                            <div className="border-r-2 border-dashed h-[715px]" style={{ borderColor: ESTILOS.rojoHeader, opacity: 0.3 }}></div>
                                        </div>

                                        <div className="col-span-1 row-span-4 bg-white">
                                            {reciboDerechoFrente ? renderRecibo(reciboDerechoFrente, indicePagina * 2 + 2) : (
                                                <div className="h-[715px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex items-center justify-center">
                                                    <span className="text-gray-300 font-bold uppercase tracking-widest text-xl rotate-45">Espacio Vacío</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-2 border-t border-gray-100 flex justify-between items-end px-4 mt-2">
                                        <div className="text-gray-400 font-bold font-mono tracking-widest text-xs uppercase">
                                            AGUA Villa Pesqueira <span className="font-normal text-[9px] normal-case opacity-70 ml-2">Sistema de Gestión Municipal</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* =======================
                                PÁGINA 2: REVERSO (ATRÁS)
                                ======================= */}
                            <div className={`mb-10 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:mb-0 print:bg-transparent print:rounded-none print:shadow-none print:border-none print:w-full print:h-screen print:flex print:flex-col print:justify-center print:items-center print:break-inside-avoid ${esUltimaPagina ? 'print:break-after-auto' : 'print:break-after-page'}`}>
                                
                                {/* Etiqueta visible solo en pantalla */}
                                <div className="bg-gray-600 text-white text-center font-bold text-xs py-1 tracking-widest uppercase print:hidden">
                                    Hoja {indicePagina + 1} - Atrás (Reverso)
                                </div>

                                <div className="w-full p-4 print:p-0 print:scale-[0.95] print:origin-center flex flex-col h-full justify-center">
                                    {/* Header Paginación del Reverso (Vacio o alineado) */}
                                    <div className="text-right text-[9px] bg-white grid grid-cols-[1fr_auto_1fr] gap-2 mb-2 px-2 border-b border-dashed border-gray-300 pb-1">
                                        <div className="text-left font-mono text-gray-500 opacity-50">Reverso</div>
                                        <div></div>
                                        <div className="text-right font-mono text-gray-500 opacity-50">Reverso</div>
                                    </div>

                                    {/* Grid de Recibos Traseros (Con cruce para dúplex) */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-4 gap-6 bg-white p-1">
                                        
                                        {/* Lado izquierdo (Corresponde a la espalda del recibo DERECHO del frente) */}
                                        <div className="col-span-1 row-span-4 bg-white">
                                            {reciboIzquierdoReverso ? renderReverso(reciboIzquierdoReverso) : (
                                                <div className="h-[715px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex items-center justify-center">
                                                    <span className="text-gray-300 font-bold uppercase tracking-widest text-xl rotate-45">Espacio Vacío</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Línea divisoria de corte principal (Exactamente la misma) */}
                                        <div className="col-span-1 row-span-4 flex justify-center relative">
                                            <div className="border-r-2 border-dashed h-[715px] opacity-20" style={{ borderColor: '#9ca3af' }}></div>
                                        </div>

                                        {/* Lado derecho (Corresponde a la espalda del recibo IZQUIERDO del frente) */}
                                        <div className="col-span-1 row-span-4 bg-white">
                                            {renderReverso(reciboDerechoReverso)}
                                        </div>
                                    </div>

                                    {/* Footer Reverso */}
                                    <div className="pt-2 border-t border-gray-100 flex justify-between items-end px-4 mt-2">
                                        <div className="text-gray-300 font-bold font-mono tracking-widest text-xs uppercase">
                                            Información Adicional
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
};

export default Recibo;