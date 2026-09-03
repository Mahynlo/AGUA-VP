import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";

const PieChart = ({ data, unit = "", type = "donut" }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Procesar datos o usar defaults ilustrativos
  const chartData = data && data.length > 0
    ? {
        series: data.map((item) => Number(item.cantidad) || 0),
        labels: data.map((item) => item.estado || "Sin clasificar")
      }
    : {
        series: [120, 180, 240],
        labels: ["Nácori Grande", "Matape", "Adivino"]
      };

  const chartColors = [
    "#3B82F6", // Azul
    "#10B981", // Esmeralda
    "#F59E0B", // Ámbar
    "#8B5CF6", // Violeta
    "#EC4899", // Rosa
    "#06B6D4", // Cian
    "#F97316", // Naranja
  ];

  const totalValue = chartData.series.reduce((acc, curr) => acc + curr, 0);

  const options = {
    chart: {
      type: type,
      background: "transparent",
      fontFamily: "inherit",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 600,
      },
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
    },
    labels: chartData.labels,
    colors: chartColors,
    stroke: {
      show: true,
      width: 2,
      colors: [isDarkMode ? "#18181b" : "#ffffff"],
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      dropShadow: { enabled: false },
      style: {
        fontSize: "11px",
        fontWeight: "700",
        colors: ["#ffffff"],
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "13px",
              fontWeight: 600,
              color: isDarkMode ? "#94a3b8" : "#64748b",
              offsetY: -4,
            },
            value: {
              show: true,
              fontSize: "18px",
              fontWeight: 800,
              color: isDarkMode ? "#f8fafc" : "#0f172a",
              offsetY: 4,
              formatter: (val) => `${Number(val).toLocaleString("es-MX")} ${unit}`.trim(),
            },
            total: {
              show: true,
              showAlways: false,
              label: "Total",
              fontSize: "12px",
              fontWeight: 600,
              color: isDarkMode ? "#94a3b8" : "#64748b",
              formatter: () => `${totalValue.toLocaleString("es-MX")} ${unit}`.trim(),
            },
          },
        },
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      fontWeight: 500,
      markers: {
        width: 10,
        height: 10,
        radius: 3,
        offsetX: -2,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
      labels: {
        colors: isDarkMode ? "#cbd5e1" : "#475569",
      },
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (val) => `${Number(val).toLocaleString("es-MX")} ${unit}`.trim(),
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <div className="w-full h-full min-h-[260px] flex items-center justify-center">
      <Chart
        options={options}
        series={chartData.series}
        type={type}
        width="100%"
        height="100%"
        key={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
};

export default PieChart;




