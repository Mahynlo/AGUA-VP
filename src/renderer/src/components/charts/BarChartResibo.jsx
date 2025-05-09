
import React from "react";
import "charts.css"

const consumoMensual = [
  { mes: "Ene", consumo: 18 },
  { mes: "Feb", consumo: 20 },
  { mes: "Mar", consumo: 55 },
  { mes: "Abr", consumo: 30 },
  { mes: "May", consumo: 25 },
  { mes: "Jun", consumo: 40 },
  
  
];

// Encuentra el máximo para escalar
const maxConsumo = Math.max(...consumoMensual.map(item => item.consumo));

const BarChartRecibo  = () => {
  return (
    <div className="grafica-container w-full h-[230px] p-6 bg-white shadow-lg rounded-lg">
      <h2>Consumo de Agua (m³)</h2>
      <table className="charts-css column data-outside data-spacing-2  show-labels show-primary-axis show-4-secondary-axes  show-data-axes">
        <caption>Consumo mensual</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Consumo</th>
          </tr>
        </thead>
        <tbody className="h-full w-full">
          {consumoMensual.map((item) => (
            <tr key={item.mes}>
              <th scope="row" className="text-[7px] rotate-45 ">{item.mes}</th>
              <td className="text-[6px] text-black" style={{ "--size": item.consumo / maxConsumo }}><a className="-rotate-45"> {item.consumo}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BarChartRecibo ;
