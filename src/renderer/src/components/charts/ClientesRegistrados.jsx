import React, { useEffect, useState, useRef } from "react";
import ApexCharts from "apexcharts";

const ClientesRegistradosChart = () => {
  const chartAreaRef = useRef(null);
  const chartBarRef = useRef(null);

  // Datos simulados: clientes nuevos por mes (timestamp + cantidad)
  // Aquí generamos 12 meses (un año) con datos aleatorios entre 20 y 80
  const generateMonthWiseTimeSeries = (startDate, count, yrange) => {
    let series = [];
    let baseDate = new Date(startDate);
    for (let i = 0; i < count; i++) {
      let time = baseDate.getTime();
      let y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
      series.push([time, y]);
      // Avanzamos 1 mes
      baseDate.setMonth(baseDate.getMonth() + 1);
    }
    return series;
  };

  const [data, setData] = useState([]);

  useEffect(() => {
    const seriesData = generateMonthWiseTimeSeries("2024-06-01", 12, {
      min: 20,
      max: 80,
    });
    setData(seriesData);
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const optionsArea = {
      chart: {
        id: "chart2",
        type: "area",
        height: 230,
        foreColor: "#ccc",
        toolbar: {
          autoSelected: "pan",
          show: false,
        },
      },
      colors: ["#00BAEC"],
      stroke: {
        width: 3,
      },
      grid: {
        borderColor: "#555",
        clipMarkers: false,
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        gradient: {
          enabled: true,
          opacityFrom: 0.55,
          opacityTo: 0,
        },
      },
      markers: {
        size: 5,
        colors: ["#000524"],
        strokeColor: "#00BAEC",
        strokeWidth: 3,
      },
      series: [
        {
          name: "Clientes Nuevos",
          data: data,
        },
      ],
      tooltip: {
        theme: "dark",
      },
      xaxis: {
        type: "datetime",
        labels: {
          format: "MMM yyyy",
          style: { colors: "#ccc" },
        },
      },
      yaxis: {
        min: 0,
        tickAmount: 4,
        labels: {
          style: { colors: "#ccc" },
        },
      },
      title: {
        text: "Clientes Registrados por Mes",
        align: "center",
        style: {
          fontSize: "20px",
          fontWeight: "bold",
          color: "#00BAEC",
          fontFamily: "Arial",
        },
      },
    };

    const optionsBar = {
      chart: {
        id: "chart1",
        height: 130,
        type: "bar",
        foreColor: "#ccc",
        brush: {
          target: "chart2",
          enabled: true,
        },
        selection: {
          enabled: true,
          fill: {
            color: "#fff",
            opacity: 0.4,
          },
          xaxis: {
            min: data[0][0],
            max: data[data.length - 1][0],
          },
        },
      },
      colors: ["#FF0080"],
      series: [
        {
          data: data,
        },
      ],
      stroke: {
        width: 2,
      },
      grid: {
        borderColor: "#444",
      },
      markers: {
        size: 0,
      },
      xaxis: {
        type: "datetime",
        tooltip: {
          enabled: false,
        },
        labels: {
          format: "MMM yyyy",
          style: { colors: "#ccc" },
        },
      },
      yaxis: {
        tickAmount: 2,
        labels: {
          style: { colors: "#ccc" },
        },
      },
    };

    const chartArea = new ApexCharts(chartAreaRef.current, optionsArea);
    const chartBar = new ApexCharts(chartBarRef.current, optionsBar);

    chartArea.render();
    chartBar.render();

    // Cleanup
    return () => {
      chartArea.destroy();
      chartBar.destroy();
    };
  }, [data]);

  return (
    <div
      id="wrapper"
      className="w-full h-full p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800 dark:border-gray-700"
    >
      <div id="chart-area" ref={chartAreaRef}></div>
      <div id="chart-bar" ref={chartBarRef} style={{ marginTop: -38 }}></div>
      
    </div>
  );
};

export default ClientesRegistradosChart;
