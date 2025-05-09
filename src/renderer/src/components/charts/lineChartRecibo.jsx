import React from "react";

const LineChartRecibo = () => {
    const consumo = [120, 150, 100, 200, 250, 300, 220, 190, 230, 280, 260, 240];
    const promedio = [110, 140, 90, 180, 230, 290, 200, 180, 210, 260, 240, 220];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Calcular el máximo valor de consumo y promedio para establecer el rango de Y
    const maxValor = Math.max(...[...consumo, ...promedio]);
    const height = 250;
    const width = 600;
    const stepX = width / (consumo.length - 1);
    
    // Generar puntos para el gráfico
    const toPoints = (data) => data.map((val, i) => {
        const x = i * stepX;
        const y = height - (val / maxValor) * height;
        return `${x},${y}`;
    }).join(" ");

    const puntosConsumo = toPoints(consumo);
    const puntosPromedio = toPoints(promedio);

    return (
        <div className="w-full max-w-4xl p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Consumo de Agua</h2>
            <div className="relative h-72">
                {/* Etiquetas del eje Y */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between items-start text-xs font-semibold text-gray-600 pl-2">
                    {[maxValor, (maxValor * 0.75), (maxValor * 0.5), (maxValor * 0.25), 0].map((val) => (
                        <span key={val}>{val}</span>
                    ))}
                </div>

                {/* Etiquetas del eje X */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between px-6 text-xs text-gray-600">
                    {meses.map((mes, i) => (
                        <span key={i}>{mes}</span>
                    ))}
                </div>

                {/* SVG del gráfico */}
                <svg className="absolute top-0 left-0 w-full h-full" viewBox={`0 0 ${width} ${height}`}>
                    <polyline
                        points={puntosConsumo}
                        fill="none"
                        stroke="rgba(75, 192, 192, 1)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <polyline
                        points={puntosPromedio}
                        fill="none"
                        stroke="rgba(54, 162, 235, 1)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
};

export default LineChartRecibo;

