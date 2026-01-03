import Chart from "react-apexcharts";
import { useEffect, useState } from "react";

const LineChart = ({ data }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Detectar cambios en el modo oscuro con MutationObserver
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Procesar datos dinámicos o usar defaults
  const isDynamic = data && data.length > 0;

  const series = isDynamic
    ? [{
      name: "Consumo Total",
      data: data.map(item => item.total)
    }]
    : [
      {
        name: "Consumo Nacori Grande",
        data: [120, 150, 100, 200, 250, 300, 220, 190, 230, 280, 260, 240],
      },
      {
        name: "Consumo Matape",
        data: [110, 140, 90, 180, 230, 590, 600, 180, 210, 260, 240, 220],
      },
      {
        name: "Consumo Adivino",
        data: [210, 240, 190, 280, 330, 250, 282, 286, 310, 260, 640, 720],
      },
    ];

  const categories = isDynamic
    ? data.map(item => item.mes)
    : [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

  const options = {
    chart: {
      type: "line",
      height: "100%",
      toolbar: { show: true },
      zoom: { enabled: true },
      background: "transparent",
      foreColor: isDarkMode ? "#cbd5e1" : "#374151",
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
      palette: 'palette1',
    },
    title: {
      text: "Consumo Mensual",
      align: "center",
      style: {
        fontSize: "20px",
        fontWeight: "bold",
        color: isDarkMode ? "#e2e8f0" : "#1e293b",
        fontFamily: "Inter, sans-serif",
      },
    },
    colors: isDarkMode ? ["#60a5fa"] : ["#0284c7"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 4,
    },
    grid: {
      borderColor: isDarkMode ? "#374151" : "#cbd5e1",
      strokeDashArray: 4,
      xaxis: {
        lines: { show: true }
      }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDarkMode ? "#94a3b8" : "#374151",
          fontSize: "12px",
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      title: {
        text: "Metros Cúbicos (m³)",
        style: {
          fontSize: "14px",
          fontWeight: "600",
          color: isDarkMode ? "#94a3b8" : "#64748b",
          fontFamily: "Inter, sans-serif",
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? "#94a3b8" : "#64748b",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      labels: {
        colors: isDarkMode ? "#e2e8f0" : "#1e293b",
      },
      markers: {
        width: 10,
        height: 10,
        radius: 10,
      }
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      y: {
        formatter: (val) => `${val} m³`
      }
    },
    markers: {
      size: 4,
      colors: isDarkMode ? ["#60a5fa"] : ["#2563eb"],
      strokeColors: isDarkMode ? "#1e293b" : "#ffffff",
      strokeWidth: 2,
      hover: {
        size: 6,
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
  };

  return (
    <div className="flex items-center justify-center p-3 rounded-lg bg-white border shadow border-gray-200 dark:border-gray-700 dark:bg-gray-800 w-full h-full">
      <div className="relative w-full h-full">
        <Chart
          options={options}
          series={series}
          type="line"
          height="100%"
          width="100%"
          key={isDarkMode ? "dark" : "light"} // 🔁 Fuerza re-render al cambiar el tema
        />
      </div>
    </div>
  );
};

export default LineChart;





