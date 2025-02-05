import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar módulos necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  // Datos para la gráfica
  const data = {
    labels: ["Nacori", "Matape", "Adivino"],
    datasets: [
      {
        label: "Litros",
        data: [123, 180, 300], // Valores
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)", // Colores de las secciones
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)", // Bordes de las secciones
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1, // Ancho de los bordes
      },
    ],
  };

  // Opciones de la gráfica
  const options = {
    responsive: true, // Hacer la gráfica responsiva
    maintainAspectRatio: false, // Permitir que el tamaño del contenedor controle la gráfica
    plugins: {
      legend: {
        position: "top", // Posición de la leyenda
      },
      tooltip: {
        enabled: true, // Habilitar tooltips al pasar el cursor
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "200px" }}> {/* Contenedor responsivo */}
      <Pie data={data} options={options} />
    </div>
  );
};

export default PieChart;



