import React, { useState, useEffect } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import { Chip, Button } from "@nextui-org/react";

const BuscarMedidor = ({ onMedidorSeleccionado, clienteId, onLiberarMedidor }) => {
    const { medidores, actualizarMedidores } = useMedidores();
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [medidoresSeleccionados, setMedidoresSeleccionados] = useState([]);
    const [medidoresLiberados, setMedidoresLiberados] = useState(new Set());


    const medidoresAsignadosCliente = medidores.filter(
        (medidor) => medidor.cliente_id === clienteId
    );

    useEffect(() => { // Filtrar medidores al cambiar la búsqueda o la lista de medidores
        if (busqueda.trim() === "") {
            setResultados([]);
            return;
        }

        const filtrados = medidores.filter((medidor) =>
            `${medidor.numero_serie} ${medidor.ubicacion}` // Filtra por número de serie o ubicación
                .toLowerCase()
                .includes(busqueda.toLowerCase())
        );

        setResultados(filtrados);
    }, [busqueda, medidores]);

    const seleccionarMedidor = (medidor) => {
        // Evita seleccionar medidores ya asignados a otro cliente
        if (medidor.cliente_id && medidor.cliente_id !== clienteId) return;

        const yaSeleccionado = medidoresSeleccionados.some(m => m.id === medidor.id);
        if (!yaSeleccionado) {
            const nuevosSeleccionados = [...medidoresSeleccionados, medidor];
            setMedidoresSeleccionados(nuevosSeleccionados);
            onMedidorSeleccionado(nuevosSeleccionados.map(m => m.id));
        }

        setBusqueda("");
        setResultados([]);
    };

    const quitarMedidor = (id) => {
        const nuevos = medidoresSeleccionados.filter(m => m.id !== id);
        setMedidoresSeleccionados(nuevos);
        onMedidorSeleccionado(nuevos.map(m => m.id));
    };

    const renderChip = (medidor) => {
        if (!medidor.cliente_id) {
            return <Chip size="sm" color="warning">Libre</Chip>;
        } else if (medidor.cliente_id === clienteId) {
            return <Chip size="sm" color="primary">De este cliente</Chip>;
        } else {
            return <Chip size="sm" color="success">Asignado</Chip>;
        }
    };

    return (
        <div className="grid gap-6 mb-6 md:grid-cols-2 mt-2">
            <div>


                <p>
                    Selecciona un medidor disponible en el pueblo del cliente para asignarle un medidor.
                </p>

                {medidoresAsignadosCliente.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-blue-600 rounded-xl mt-2">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                            Medidores ya asignados a este cliente:
                        </p>
                        {medidoresAsignadosCliente.map(medidor => (
                            <div
                                key={medidor.id}
                                className="flex justify-between items-center mt-1 text-sm dark:text-white"
                            >
                                <span>
                                    <strong>{medidor.numero_serie}</strong> – {medidor.ubicacion}
                                </span>
                                <Button
                                    size="sm"
                                    color={medidoresLiberados.has(medidor.id) ? "success" : "warning"}
                                    variant={medidoresLiberados.has(medidor.id) ? "solid" : "flat"}
                                    onClick={() => {
                                        setMedidoresLiberados(prev => {
                                            const nuevoSet = new Set(prev);
                                            if (nuevoSet.has(medidor.id)) {
                                                nuevoSet.delete(medidor.id);
                                            } else {
                                                nuevoSet.add(medidor.id);
                                            }
                                            onLiberarMedidor(Array.from(nuevoSet)); // Convertimos a array solo para enviar
                                            //console.log("Medidores liberados:", Array.from(nuevoSet));
                                            return nuevoSet;
                                        });
                                    }}
                                >
                                    {medidoresLiberados.has(medidor.id) ? "Liberado" : "Liberar"}
                                </Button>


                            </div>
                        ))}
                    </div>
                )}

            </div>


            <div className="relative">

                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Buscar Medidor
                </label>
                <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl bg-gray-50 dark:bg-neutral-800 dark:text-white dark:border-gray-600"
                    placeholder="Escribe número de serie o pueblo..."
                    value={busqueda}
                    onChange={(e) => {
                        setBusqueda(e.target.value);
                    }}
                />

                {resultados.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border dark:border-gray-600 mt-2 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                        {resultados.map((medidor) => (
                            <li
                                key={medidor.id}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => seleccionarMedidor(medidor)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{medidor.numero_serie}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{medidor.ubicacion}</p>
                                    </div>
                                    {renderChip(medidor)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}


                {medidoresSeleccionados.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Medidores seleccionados:
                        </p>
                        <ul className="space-y-1">
                            {medidoresSeleccionados.map((m) => (
                                <li key={m.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl">
                                    <span className="text-sm dark:text-white">
                                        <strong>{m.numero_serie}</strong> – {m.ubicacion}
                                    </span>
                                    <Button size="sm" color="danger" variant="flat" onClick={() => quitarMedidor(m.id)}>
                                        Quitar
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>


        </div>
    );
};

export default BuscarMedidor;


