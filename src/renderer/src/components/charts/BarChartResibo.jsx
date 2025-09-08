
import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const consumoMensual = [
  { mes: "Ene", consumo: 18 },
  { mes: "Feb", consumo: 20 },
  { mes: "Mar", consumo: 55 },
  { mes: "Abr", consumo: 30 },
  { mes: "May", consumo: 27 },
  { mes: "Jun", consumo: 45 },
  { mes: "Jul", consumo: 60 },
  { mes: "Ago", consumo: 50 },
  { mes: "Sep", consumo: 30 },
  { mes: "Oct", consumo: 25 },
  { mes: "Nov", consumo: 21 },
  { mes: "Dic", consumo: 15 },
];

const BarChartRecibo = ({ consumoData = consumoMensual }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const categorias = consumoData.map(item => item.mes);
    const datos = consumoData.map(item => item.consumo);

    const options = {
      chart: {
        type: "bar",
        height: 185,
        width: 205, // Especificar ancho exacto para el espacio cuadrado
        toolbar: {
          show: false,
        },
        animations: {
          enabled: false,
        },
        background: 'transparent',
        margin: {
          top: 5,
          right: 5,
          bottom: 20, // Espacio para etiquetas
          left: 15, // Espacio para eje Y
        },
      },
      series: [
        {
          name: "Consumo (m³)",
          data: datos,
        },
      ],
      xaxis: {
        categories: categorias,
        labels: {
          style: {
            fontSize: "6px", // Muy pequeño para que quepan los 12 meses
            fontWeight: 500,
            colors: "#af272f", // Color rojo del recibo
          },
          rotate: -45, // Rotar para mejor ajuste
          maxHeight: 30,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: "6px", // Pequeño para ahorrar espacio
            colors: "#af272f", // Color rojo del recibo
          },
          formatter: function (val) {
            return Math.round(val);
          },
        },
        title: {
          text: "m³",
          style: {
            fontSize: "7px",
            color: "#af272f", // Color rojo del recibo
            fontWeight: 600,
          },
        },
      },
      colors: ["#27afa7"], // Color naranja del recibo para las barras
      plotOptions: {
        bar: {
          borderRadius: 2,
          columnWidth: "60%", // Barras más estrechas para que quepan 12 meses
          distributed: false,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "6px", // Muy pequeño para que quepa en las barras
          fontWeight: 600,
          colors: ["#FFFFFF"],
        },
        offsetY: -2,
        formatter: function (val) {
          return Math.round(val);
        },
      },
      grid: {
        show: true,
        borderColor: "#af272f", // Color rojo del recibo para la cuadrícula
        strokeDashArray: 1,
        padding: {
          top: 0,
          right: 5,
          bottom: 0,
          left: 5,
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      legend: {
        show: false, // Sin leyenda para ahorrar espacio
      },
      tooltip: {
        enabled: false, // Sin tooltip para impresión
      },
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => chart.destroy();
  }, [consumoData]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div ref={chartRef} className="w-full" />
    </div>
  );
};

export default BarChartRecibo;
