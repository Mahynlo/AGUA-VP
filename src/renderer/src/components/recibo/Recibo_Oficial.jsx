
import logoagua from '../../assets/images/logo_login.png'
import BarChartRecibo from '../charts/BarChartResibo';
import { InfoResibosIcon, ValanzaResibosIcon } from '../../IconsApp/IconsResibos';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAnuncioRecibo from '../../hooks/useAnuncioRecibo';
import useEquivalenciaConsumo from '../../hooks/useEquivalenciaConsumo';

const Recibo = ({ facturaData = null }) => {
    const [searchParams] = useSearchParams();
    const [paginasRecibos, setPaginasRecibos] = useState([]);

    // Hook para el anuncio personalizado
    const { anuncio } = useAnuncioRecibo();

    // Hook para las equivalencias de consumo
    const { obtenerFraseEquivalencia } = useEquivalenciaConsumo();

    // Crear fecha una sola vez
    const fechaActual = new Date().toISOString();
    const fechaHora = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Si se pasa facturaData directamente, usarla; sino, obtener de URL
    useEffect(() => {
        if (facturaData) {
            // Si viene una factura individual como prop, renderizar solo esa
            return;
        }

        const facturasParam = searchParams.get('facturas');
        if (facturasParam) {
            try {
                const facturas = JSON.parse(decodeURIComponent(facturasParam));
                setPaginasRecibos(facturas);
            } catch (error) {
                console.error('Error al parsear facturas:', error);
                // Usar datos de ejemplo si hay error
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
            // Datos de ejemplo por defecto
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
    }, [searchParams, facturaData]);

    // Función para renderizar un recibo individual
    const renderRecibo = (factura, numeroRecibo) => {
        if (!factura) return null;

        return (
            <div key={factura.id} className="grid grid-cols-4 grid-rows-8 gap-2 h-[715px] dark:bg-white">
                <div className="col-span-4 border-2 border-solid rounded-xl p-2 flex font-bold text-white" style={{ backgroundColor: '#af272f' }}>
                    <img src={logoagua} className="h-[50px]" alt="Logo Agua" />
                    <div className="">
                        <p className='text-[16px]'>
                            Cuidemos del Agua
                        </p>
                        <p className='text-[12px]'>
                            Comisión Municipal de Agua Potable y Alcantarillado
                        </p>
                        <p className='text-[11px]'>Villa Pesqueira, Sonora</p>
                    </div>
                </div>

                {/*Card izquierda */}
                <div className="col-span-2 row-span-4 row-start-2 border-2 border-solid rounded-xl text-black p-1 " style={{ backgroundColor: '#af6327' }}>
                    <div className="grid grid-cols-2 grid-rows-1 gap-2 font-bold text-white">
                        <div className="col-span-2 row-span-1 border-2 border-solid rounded-xl text-[10px] text-center " style={{ backgroundColor: '#af272f' }}>Datos de cliente:</div>

                        <div className="col-span-2 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px]">
                            <div className='flex flex-col gap-1'>
                                <div className='flex'>

                                    <span className='text-gray-800 text-[10px] px-2'>{factura.cliente_nombre}</span>
                                </div>
                                <div className='flex'>

                                    <span className='text-gray-800 text-[10px] px-2'>{factura.direccion_cliente || "N/A"}</span>
                                </div>
                                <div className='flex'>

                                    <span className='text-gray-800 text-[10px] px-2'>{factura.cliente_ciudad || "Villa Pesqueira,Son"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 row-span-1 border-2 border-solid rounded-xl text-[10px] text-center" style={{ backgroundColor: '#af272f' }}>Informacion de Servicio:</div>
                        <div className="col-span-2 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px]">
                            <div className='flex flex-col gap-1'>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>No. Medidor:</span>
                                    <span className='text-gray-800'>{factura.medidor?.numero_serie || "N/A"}</span>
                                </div>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Consumo:</span>
                                    <span className='text-gray-800'>{factura.consumo_m3} m³</span>
                                </div>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Tarifa:</span>
                                    <span className='text-gray-800'>{factura.tarifa_nombre || "N/A"}</span>
                                </div>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Ruta:</span>
                                    <span className='text-gray-800'>{factura.ruta?.nombre || "N/A"}</span>
                                </div>
                            </div>
                        </div>


                        <div className="col-span-2 row-span-1 border-2 border-solid rounded-xl text-[10px] text-center" style={{ backgroundColor: '#af272f' }}>Detalle de facturacion:</div>
                        <div className="col-span-2 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px] ">
                            <div className='flex flex-col gap-1'>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Mes facturado:</span>
                                    <span className='text-gray-800'>{factura.mes_facturado}</span>
                                </div>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Fecha lectura:</span>
                                    <span className='text-gray-800'>{new Date(factura.fecha_emision).toLocaleDateString('es-ES')}</span>
                                </div>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Total del mes:</span>
                                    <span className='text-gray-800'>${factura.total?.toFixed(2)}</span>
                                </div>
                                <div className='flex'>
                                    <span className='font-bold text-gray-700 w-20 px-2'>Adeudo:</span>
                                    <span className='text-gray-800'>{factura.saldo_pendiente > 0 ? `$${factura.saldo_pendiente.toFixed(2)}` : "Sin Adeudo"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 row-span-1 border-2 border-solid rounded-xl text-[9px] text-center" style={{ backgroundColor: '#ffffffff' }}>
                            <p className='text-black text-[15px]'>Total, a pagar: ${factura.total?.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/*Card derecha */}
                <div className="col-span-2 row-span-4 col-start-3 row-start-2 border-2 border-solid rounded-xl p-1" style={{ backgroundColor: '#af6327' }}>
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 font-bold">
                        <div className="col-span-2 row-span-1 border-2 border-solid rounded-xl text-[10px] text-center text-white" style={{ backgroundColor: '#af272f' }}>Información de Consumo:</div>

                        <div className="col-span-1 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px] text-center text-black  ">
                            Mes actual:<p className='text-gray-800'>{factura.consumo_m3}m³</p>
                        </div>
                        <div className="col-span-1 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px] text-center text-black ">
                            Mes anterior: <p className='text-gray-800'>{Math.max(0, factura.consumo_m3 - 2)}m³</p>
                        </div>
                        <div className="col-span-1 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px] text-center text-black ">
                            Promedio de consumo: <p className='text-gray-800'>{Math.round(factura.consumo_m3 * 0.9)} m³</p>
                        </div>
                        <div className="col-span-1 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px] text-center text-black ">
                            Variación: <p className='text-gray-800'>{Math.round(Math.random() * 20 - 10)}%</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-white border-2 border-solid rounded-xl text-[9px] text-center w-full">
                            <BarChartRecibo />
                        </div>
                    </div>
                </div>

                <div className="col-span-2 row-start-6 border-2 border-solid rounded-xl text-black p-1" style={{ backgroundColor: '#af2773' }}>
                    <div className='flex gap-2 font-bold text-white text-[14px]'>
                        <InfoResibosIcon className="h-5 w-5 " />
                        Información
                    </div>
                    <p className='text-[9px] gap-2 font-bold text-gray-200 pl-3'>
                        {anuncio}
                    </p>
                </div>
                <div className="col-span-2 col-start-3 row-start-6 border-2 border-solid rounded-xl text-black p-1" style={{ backgroundColor: '#27af63' }}>
                    <div className='flex gap-2 font-bold text-white text-[14px]'>
                        <ValanzaResibosIcon className="h-5 w-5 " />
                        Consumo Equivalente
                    </div>
                    <p className='text-[9px] gap-2 font-bold text-gray-200 pl-3'>
                        {obtenerFraseEquivalencia(factura.consumo_m3) || `Equivalencia del consumo: ${factura.consumo_m3} m³`}
                    </p>
                </div>
                <div className="col-span-4 row-span-2 row-start-7 border-t-2 border-dashed" style={{ borderColor: '#af272f' }}>
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
                                <p className='text-[11px]'>Total, a pagado:$_______________________</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    // Si se pasa una factura individual como prop, renderizar solo esa
    if (facturaData) {
        return (
            <div className="w-full">
                {renderRecibo(facturaData, 1)}
            </div>
        );
    }

    return (
        <div className=''>
            {paginasRecibos.map((paginaRecibos, indicePagina) => (
                <div key={indicePagina} className="border-1 border-dashed border-gray-100">
                    {/* Header con numeración - layout de 3 columnas para consistencia */}
                    <div className="text-right  text-[9px] bg-white grid grid-cols-[1fr_auto_1fr] gap-2 mb-2">

                        <div className="text-right">
                            Fecha y hora: {fechaHora} Recibo No: {indicePagina * 2 + 1}
                        </div>
                        <div className='text-center'></div>
                        <div className="text-right">
                            {paginaRecibos[1] ? `Fecha y hora: ${fechaHora} Recibo No: ${indicePagina * 2 + 2}` : ''}
                        </div>
                    </div>

                    {/* Siempre usar layout de 2 columnas para consistencia */}
                    <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-4 gap-2 bg-white h-full">

                        {/* Primer recibo - siempre en la mitad izquierda */}
                        <div className="col-span-1 row-span-4 bg-white">
                            {renderRecibo(paginaRecibos[0], indicePagina * 2 + 1)}
                        </div>

                        {/* Línea divisoria - siempre presente para consistencia */}
                        <div className="col-span-1 row-span-4">
                            <div className="border-r-2 border-dashed h-[715px]" style={{ borderColor: '#af272f' }}></div>
                        </div>

                        {/* Segundo recibo (si existe) - mitad derecha */}
                        <div className="col-span-1 row-span-4 bg-white">
                            {paginaRecibos[1] ? renderRecibo(paginaRecibos[1], indicePagina * 2 + 2) : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Recibo;