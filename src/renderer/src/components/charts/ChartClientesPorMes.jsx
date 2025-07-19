import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ClientesPorMesChart = ({ clientes = [] }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const registrosPorMes = [];
    const categorias = [];

    const ahora = new Date();
    const mesActual = ahora.getMonth(); // 0 a 11

    // Inicializa los meses hasta el actual
    for (let i = 0; i <= mesActual; i++) {
      registrosPorMes.push(0);
      categorias.push(
        new Date(0, i).toLocaleString("es-MX", { month: "long" }).toUpperCase()
      );
    }

    // Contar registros por mes hasta el mes actual
    clientes.forEach((c) => {
      const fecha = new Date(c.fecha_creacion.replace(" ", "T"));
      const mes = fecha.getMonth();
      if (mes <= mesActual) registrosPorMes[mes]++;
    });

    const chart = new ApexCharts(chartRef.current, {
      chart: {
        type: "bar",
        height: 350,
        foreColor: "#333",
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: true,
          },
        },
        animations: {
          enabled: true,
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300,
            },
            plotOptions: {
              bar: {
                columnWidth: "60%",
              },
            },
          },
        },
      ],
      title: {
        text: "Clientes Registrados por Mes",
        align: "center",
        style: {
          fontSize: "20px",
          fontWeight: "bold",
          color: "#00BAEC",
        },
      },
      series: [
        {
          name: "Clientes",
          data: registrosPorMes,
        },
      ],
      xaxis: {
        categories: categorias,
        labels: {
          style: {
            fontWeight: 600,
          },
        },
      },
      colors: ["#00BAEC"],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "50%",
        },
      },
      dataLabels: {
        enabled: true,
      },
    });

    chart.render();

    return () => chart.destroy();
  }, [clientes]);

  return (
    <div className="w-full p-4 bg-white shadow-lg rounded-lg dark:bg-gray-800">
      <div ref={chartRef} />
    </div>
  );
};

export default ClientesPorMesChart;
