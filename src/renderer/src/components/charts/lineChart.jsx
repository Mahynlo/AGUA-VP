import Chart from "react-apexcharts";
import { useEffect, useState } from "react";

const LineChart = () => {
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

  const series = [
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

  const options = {
    chart: {
      type: "line",
      height: "100%",
      toolbar: { show: true },
      zoom: { enabled: true },
      background: isDarkMode ? "#1f2937" : "#ffffff",
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
    },
    title: {
      text: "Consumo del Municipio",
      align: "center",
      style: {
        fontSize: "20px",
        fontWeight: "bold",
        color: isDarkMode ? "#5eead4" : "rgba(75, 192, 192, 1)",
        fontFamily: "Arial",
      },
    },
    colors: isDarkMode
      ? ["#5eead4", "#22d3ee", "#4ade80"]
      : ["rgba(75, 192, 192, 1)", "rgba(54, 162, 235, 1)", "rgb(54, 235, 117)"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ],
      title: {
        text: "Meses",
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          color: isDarkMode ? "#5eead4" : "rgba(75, 192, 192, 1)",
          fontFamily: "Arial",
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? "#cbd5e1" : "#374151",
        },
      },
      axisBorder: {
        show: true,
        color: isDarkMode ? "#475569" : "#94a3b8",
      },
      axisTicks: {
        show: true,
        color: isDarkMode ? "#475569" : "#94a3b8",
      },
    },
    yaxis: {
      title: {
        text: "Consumo (metros cúbicos)",
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          color: isDarkMode ? "#5eead4" : "rgba(75, 192, 192, 1)",
          fontFamily: "Arial",
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? "#cbd5e1" : "#374151",
        },
      },
      min: 0,
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      labels: {
        colors: isDarkMode ? "#cbd5e1" : "#374151",
      },
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





