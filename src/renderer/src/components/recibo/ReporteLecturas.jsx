import React from "react";

const ReporteLecturas = () => {
    const data = [
        { rpu: "1001", medidor: "M123", usuario: "Juan Pérez Del Monte", direccion: "Calle Falsa 123" },
        { rpu: "1002", medidor: "M124", usuario: "Ana Gómez de La Loma", direccion: "Av. Siempre Viva 742" },
        { rpu: "1003", medidor: "M125", usuario: "Luis Hernández", direccion: "Calle de la Amargura 456" },
        { rpu: "1004", medidor: "M126", usuario: "María López", direccion: "Calle de la Alegría 789" },
        { rpu: "1005", medidor: "M127", usuario: "Carlos Ruiz", direccion: "Calle del Sol 101" },
        { rpu: "1006", medidor: "M128", usuario: "Laura Martínez", direccion: "Calle de la Luna 202" },
        { rpu: "1007", medidor: "M129", usuario: "Pedro Sánchez", direccion: "Calle del Mar 303" },
        { rpu: "1008", medidor: "M130", usuario: "Sofía Torres", direccion: "Calle del Viento 404" },
        { rpu: "1009", medidor: "M131", usuario: "Javier Ramírez", direccion: "Calle de la Tierra 505" },
        { rpu: "1010", medidor: "M132", usuario: "Claudia Morales", direccion: "Calle del Agua 606" },
        { rpu: "1003", medidor: "M125", usuario: "Luis Hernández", direccion: "Calle de la Amargura 456" },
        { rpu: "1004", medidor: "M126", usuario: "María López", direccion: "Calle de la Alegría 789" },
        { rpu: "1005", medidor: "M127", usuario: "Carlos Ruiz", direccion: "Calle del Sol 101" },
        { rpu: "1006", medidor: "M128", usuario: "Laura Martínez", direccion: "Calle de la Luna 202" },
        { rpu: "1007", medidor: "M129", usuario: "Pedro Sánchez", direccion: "Calle del Mar 303" },

        { rpu: "1001", medidor: "M123", usuario: "Juan Pérez Del Monte", direccion: "Calle Falsa 123" },
        { rpu: "1002", medidor: "M124", usuario: "Ana Gómez de La Loma", direccion: "Av. Siempre Viva 742" },
        { rpu: "1003", medidor: "M125", usuario: "Luis Hernández", direccion: "Calle de la Amargura 456" },
        { rpu: "1004", medidor: "M126", usuario: "María López", direccion: "Calle de la Alegría 789" },
        { rpu: "1005", medidor: "M127", usuario: "Carlos Ruiz", direccion: "Calle del Sol 101" },
        { rpu: "1006", medidor: "M128", usuario: "Laura Martínez", direccion: "Calle de la Luna 202" },
        { rpu: "1007", medidor: "M129", usuario: "Pedro Sánchez", direccion: "Calle del Mar 303" },
        { rpu: "1008", medidor: "M130", usuario: "Sofía Torres", direccion: "Calle del Viento 404" },
        { rpu: "1009", medidor: "M131", usuario: "Javier Ramírez", direccion: "Calle de la Tierra 505" },
        { rpu: "1010", medidor: "M132", usuario: "Claudia Morales", direccion: "Calle del Agua 606" },
        { rpu: "1003", medidor: "M125", usuario: "Luis Hernández", direccion: "Calle de la Amargura 456" },
        { rpu: "1004", medidor: "M126", usuario: "María López de la Lumbre de Martinez briones ", direccion: "Calle de la Alegría 789" },
        { rpu: "1005", medidor: "M127", usuario: "Carlos Ruiz del monte negro", direccion: "Calle del Sol 101" },
        { rpu: "1006", medidor: "M128", usuario: "Laura Martínez", direccion: "Calle de la Luna 202" },


        // ... más registros
    ];

    const getFechaHora = () => {
        const now = new Date();
        return now.toLocaleString("es-MX");
    };

    {/*fecha*/ }
    const getFecha = () => {
        const now = new Date();
        return now.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    {/*hora*/ }
    const getHora = () => {
        const now = new Date();
        return now.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <div className="p-8 bg-white text-black font-sans">
            {/* Encabezado */}
            <div className="flex justify-between items-start mb-6">
                <div className="text-right text-sm space-y-1 text-xs">

                    <div>Version 1.0.8</div> {/* Simulado por ahora */}
                </div>

                <div className="flex-1 text-center ml-4">
                    <h1 className="text-2xl font-bold">Reporte de toma de lecturas</h1>
                    <h2 className="text-lg font-semibold">Municipio</h2>
                </div>

                <div className="text-right text-sm space-y-1 text-xs">
                    <p className="font-semibold">Fecha: {getFecha()}</p>
                    <p className="font-semibold">Hora: {getHora()}</p>

                </div>
            </div>

            {/* Tabla de datos */}
            <div className="flex justify-between items-start "><h3>Pueblo</h3>
                <div>Página No. 1</div> {/* Simulado por ahora */}
            </div>
            <table className="w-full border border-black border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2">#</th>
                        <th className="border border-black p-2">R.P.U</th>
                        <th className="border border-black p-2">No. Medidor</th>
                        <th className="border border-black p-2">Usuario</th>
                        <th className="border border-black p-2">Dirección</th>
                        <th className="border border-black p-2">Lectura anterior</th>
                        <th className="border border-black p-2">Lectura actual</th>
                        <th className="border border-black p-2">Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => (
                        <tr key={idx} className="border border-black text-center text-[12px]">
                            <td className="border border-black  text-center">{idx + 1}</td>
                            <td className="border border-black ">{item.rpu}</td>
                            <td className="border border-black ">{item.medidor}</td>
                            <td className="border border-black ">{item.usuario}</td>
                            <td className="border border-black ">{item.direccion}</td>
                            <td className="border border-black "></td>
                            <td className="border border-black "></td>
                            <td className="border border-black "></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReporteLecturas;
