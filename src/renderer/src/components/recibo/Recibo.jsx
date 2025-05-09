
import logoagua from '../../assets/images/logo_login.png'
import BarChartRecibo from '../charts/BarChartResibo';
import { InfoResibosIcon, ValanzaResibosIcon } from '../../IconsApp/IconsResibos';

const Recibo = () => {
    const fechaHora = new Date().toLocaleString();
    return (
        <div className=''>
            <div className=" text-right text-[9px] bg-white flex justify-between  "><p ></p> <p className='mr-6'>Fecha y hora: {fechaHora} Resibo No: 2</p> <p>Fecha y hora: {fechaHora} Resibo No: 2</p></div>

            <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] grid-rows-4 gap-2 bg-white h-full">

                <div className="col-span-2 row-span-4 bg-white ">

                    <div className="grid grid-cols-4 grid-rows-8 gap-2 h-[728px]">
                        <div className="col-span-4 bg-blue-200 border-2 border-solid rounded-xl p-2 flex font-bold text-blue-600">
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
                        <div className="col-span-2 row-span-4 row-start-2 bg-indigo-200 border-2 border-solid rounded-xl text-black p-1 ">

                            <div className="grid grid-cols-2 grid-rows-2 gap-2 font-bold text-blue-600">

                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center ">Datos de cliente:</div>

                                <div className="col-span-2 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Usuario: <a className='text-gray-600'>Juan Albeto Munguia del Sol</a></div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Dirección: <p className='text-gray-600'>Domicilio conocido  </p> </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Pueblo: <p className='text-gray-600'>Pueblo nombre </p> </div>


                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center">Informacion de Servicio:</div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">No. Medidor: <p className='text-gray-600' > NG-12345</p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Consumo Medio: <p className='text-gray-600'>12m3 </p></div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Tarifa: <p className='text-gray-600'>Tarifa Domestica </p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Ruta: <p className='text-gray-600'>13/4 </p>  </div>

                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center">Detalle de facturacion:</div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Mes facturado: <p className='text-gray-600'> 03</p> </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Periodo de lectura: <p className='text-gray-600'>02/03/2025 </p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Total del mes: <p className='text-gray-600'>$ 100.00  </p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Adeudo:<p className='text-gray-600'> Sin Adeudo</p>  </div>
                                <div className="col-span-2 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] mb-2 text-center">Total, a pagar: <p className='text-gray-600'> $ 100.00</p>  </div>
                            </div>
                        </div>
                        {/*Card derecha */}

                        <div className="col-span-2 row-span-4 col-start-3 row-start-2 bg-indigo-200 border-2 border-solid rounded-xl p-1">
                            <div className="grid grid-cols-2 grid-rows-2 gap-2 font-bold text-blue-600">

                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center ">Información de Consumo:</div>

                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Mes actual:<p className='text-gray-600'>28m3</p> </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Mes anterior: <p className='text-gray-600'>30m3</p>   </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Promedio de consumo: <p className='text-gray-600'>25 m3</p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Aumento de Consumo: <p className='text-gray-600'>30%</p></div>
                                <div className="col-span-2 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">


                                    <BarChartRecibo />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 row-start-6 bg-pink-200 border-2 border-solid rounded-xl text-black p-1 ">
                            <div className='flex gap-2 font-bold text-red-600 text-[14px]'>
                                <InfoResibosIcon className="h-6 w-6 " />
                                Información
                            </div>
                            <p className='text-[9px] gap-2 font-bold text-gray-600 pl-3'>
                                Este es un anuancio aqui va un auncio improttante que deberia de decir algo importante
                                Este es un anuancio aqui
                            </p>
                        </div>
                        <div className="col-span-2 col-start-3 row-start-6 bg-green-200 border-2 border-solid rounded-xl text-black p-1">
                            <div className='flex gap-2 font-bold text-green-600 text-[14px]'>
                                <ValanzaResibosIcon className="h-6 w-6 " />
                                Consumo Equivalente
                            </div>
                            <p className='text-[9px] gap-2 font-bold text-gray-600 pl-3'>
                                Este es un anuancio aqui va un auncio improttante que deberia de decir algo
                                Este es un anuancio aqui
                            </p>
                        </div>
                        <div className="col-span-4 row-span-2 row-start-7 border-t-2 border-dashed border-blue-500 ">
                            <div className=" bg-indigo-200 border-2 border-solid rounded-xl text-black p-1 mt-3">

                                <div className='flex flex-row font-bold text-blue-600 '>
                                    <p className='basis-64 m-2'>Notas:</p>
                                    <div className='basis-64 ml-6 m-2 gap-8'>
                                        <p className=''>Informacion de Nota: </p>
                                        <p className='text-[11px] flex'>
                                            Usuario: <p className='text-gray-600'> Juan Albeto Munguia del Sol</p>
                                        </p>

                                        <p className='text-[11px] flex'>
                                            Dirección: <p className='text-gray-600'> Domicilio conocido</p>
                                        </p>
                                        <p className='text-[11px] flex'>
                                            Mes facturado: <p className='text-gray-600'> 03</p>
                                        </p>
                                        <p className='text-[11px]'>Fecha de pago: </p>

                                        <p className='text-[11px]'>Total, a pagar:</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
                {/* Línea divisoria (col 3) */}
                <div className="col-span-1 row-span-4 ">
                    <div className="border-r-2 border-dashed border-blue-500 h-full"></div>
                </div>

                <div className="col-span-2 row-span-4 bg-white  ">

                    <div className="grid grid-cols-4 grid-rows-8 gap-2 h-[728px]">
                        <div className="col-span-4 bg-blue-200 border-2 border-solid rounded-xl p-2 flex font-bold text-blue-600">
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
                        <div className="col-span-2 row-span-4 row-start-2 bg-indigo-200 border-2 border-solid rounded-xl text-black p-1 ">

                            <div className="grid grid-cols-2 grid-rows-2 gap-2 font-bold text-blue-600">

                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center ">Datos de cliente:</div>

                                <div className="col-span-2 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Usuario: <a className='text-gray-600'>Juan Albeto Munguia del Sol</a></div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Dirección: <p className='text-gray-600'>Domicilio conocido  </p> </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Pueblo: <p className='text-gray-600'>Pueblo nombre </p> </div>


                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center">Informacion de Servicio:</div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">No. Medidor: <p className='text-gray-600' > NG-12345</p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Consumo Medio: <p className='text-gray-600'>12m3 </p></div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Tarifa: <p className='text-gray-600'>Tarifa Domestica </p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Ruta: <p className='text-gray-600'>13/4 </p>  </div>

                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center">Detalle de facturacion:</div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Mes facturado: <p className='text-gray-600'> 03</p> </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Periodo de lectura: <p className='text-gray-600'>02/03/2025 </p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Total del mes: <p className='text-gray-600'>$ 100.00  </p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Adeudo:<p className='text-gray-600'> Sin Adeudo</p>  </div>
                                <div className="col-span-2 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Total, a pagar: <p className='text-gray-600'> $ 100.00</p>  </div>
                            </div>
                        </div>
                        {/*Card derecha */}

                        <div className="col-span-2 row-span-4 col-start-3 row-start-2 bg-indigo-200 border-2 border-solid rounded-xl p-1">
                            <div className="grid grid-cols-2 grid-rows-2 gap-2 font-bold text-blue-600">

                                <div className="col-span-2 row-span-1 bg-blue-200 border-2 border-solid rounded-xl text-[12px] text-center ">Información de Consumo:</div>

                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Mes actual:<p className='text-gray-600'>28m3</p> </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Mes anterior: <p className='text-gray-600'>30m3</p>   </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Promedio de consumo: <p className='text-gray-600'>25 m3</p>  </div>
                                <div className="col-span-1 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">Aumento de Consumo: <p className='text-gray-600'>30%</p></div>
                                <div className="col-span-2 row-span-1 bg-blue-100 border-2 border-solid rounded-xl text-[9px] text-center">


                                    <BarChartRecibo />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 row-start-6 bg-pink-200 border-2 border-solid rounded-xl text-black p-1 ">
                            <div className='flex gap-2 font-bold text-red-600 text-[14px]'>
                                <InfoResibosIcon className="h-6 w-6 " />
                                Información
                            </div>
                            <p className='text-[9px] gap-2 font-bold text-gray-600 pl-3'>
                                Este es un anuancio aqui va un auncio improttante que deberia de decir algo importante
                                Este es un anuancio aqui
                            </p>
                        </div>
                        <div className="col-span-2 col-start-3 row-start-6 bg-green-200 border-2 border-solid rounded-xl text-black p-1">
                            <div className='flex gap-2 font-bold text-green-600 text-[14px]'>
                                <ValanzaResibosIcon className="h-6 w-6 " />
                                Consumo Equivalente
                            </div>
                            <p className='text-[9px] gap-2 font-bold text-gray-600 pl-3'>
                                Este es un anuancio aqui va un auncio improttante que deberia de decir algo
                                Este es un anuancio aqui
                            </p>
                        </div>
                        <div className="col-span-4 row-span-2 row-start-7 border-t-2 border-dashed border-blue-500 ">
                            <div className=" bg-indigo-200 border-2 border-solid rounded-xl text-black p-1 mt-3">

                                <div className='flex flex-row font-bold text-blue-600 '>
                                    <p className='basis-64 m-2'>Notas:</p>
                                    <div className='basis-64 ml-6 m-2 gap-8'>
                                        <p className=''>Informacion de Nota: </p>
                                        <p className='text-[11px] flex'>
                                            Usuario: <p className='text-gray-600'> Juan Albeto Munguia del Sol</p>
                                        </p>

                                        <p className='text-[11px] flex'>
                                            Dirección: <p className='text-gray-600'> Domicilio conocido</p>
                                        </p>
                                        <p className='text-[11px] flex'>
                                            Mes facturado: <p className='text-gray-600'> 03</p>
                                        </p>
                                        <p className='text-[11px]'>Fecha de pago: </p>

                                        <p className='text-[11px]'>Total, a pagar:</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>






            

        </div>

    )
};

export default Recibo;
