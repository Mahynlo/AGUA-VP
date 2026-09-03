import Chart from "react-apexcharts";
import { useEffect, useState } from "react";

const LineChart = ({ data, hideCardWrapper = false, showTitle = true }) => {
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

  // Convierte "03-2026" o "2026-03" a "Mar 2026"
  const formatearMes = (cadenaMes) => {
    if (!cadenaMes) return "Desconocido";
    
    const partes = cadenaMes.split("-");
    if (partes.length === 2) {
      const esAnioPrimero = partes[0].length === 4;
      const mes = parseInt(esAnioPrimero ? partes[1] : partes[0], 10);
      const anio = esAnioPrimero ? partes[0] : partes[1];
      
      const fecha = new Date(anio, mes - 1, 1);
      const nombreMes = fecha.toLocaleString("es-MX", { month: "short" });
      
      return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${anio}`;
    }
    return cadenaMes;
  };

  const isDynamic = data && data.length > 0;

  const series = isDynamic
    ? [{
        name: "Consumo Total",
        data: data.map(item => Number(item.total) || 0)
      }]
    : [
        { name: "Nácori Grande", data: [120, 150, 100, 200, 250, 300, 220, 190, 230, 280, 260, 240] },
        { name: "Matape", data: [110, 140, 90, 180, 230, 590, 600, 180, 210, 260, 240, 220] },
        { name: "Adivino", data: [210, 240, 190, 280, 330, 250, 282, 286, 310, 260, 640, 720] },
      ];

  const categories = isDynamic
    ? data.map(item => formatearMes(item.mes))
    : ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const chartColors = isDarkMode 
    ? ["#3b82f6", "#10b981", "#8b5cf6"] 
    : ["#2563eb", "#059669", "#7c3aed"]; 

  const options = {
    chart: {
      type: "area",
      height: "100%",
      fontFamily: 'inherit',
      background: "transparent",
      toolbar: { 
        show: true,
        tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
      },
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
    },
    colors: chartColors,
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: isDarkMode ? 0.35 : 0.3,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    title: showTitle ? {
      text: "Historial de Consumo",
      align: "left",
      offsetX: 10,
      style: {
        fontSize: "16px",
        fontWeight: "700",
        color: isDarkMode ? "#f8fafc" : "#0f172a",
      },
    } : undefined,
    grid: {
      show: true,
      borderColor: isDarkMode ? "#27272a" : "#f1f5f9",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }, 
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 10, bottom: 0, left: 10 },
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: isDarkMode ? "#a1a1aa" : "#64748b",
          fontSize: "12px",
          fontWeight: 500,
        },
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      title: {
        text: "Volumen (m³)",
        style: {
          fontSize: "12px",
          fontWeight: "600",
          color: isDarkMode ? "#a1a1aa" : "#64748b",
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? "#a1a1aa" : "#64748b",
          fontSize: "11px",
        },
        formatter: (val) => `${val.toFixed(0)}` 
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      offsetY: -10, 
      fontSize: "12px",
      fontWeight: 500,
      labels: {
        colors: isDarkMode ? "#cbd5e1" : "#334155",
      },
      markers: {
        width: 10,
        height: 10,
        radius: 3, 
      }
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      x: {
        show: true,
      },
      y: {
        formatter: (val) => `${Number(val).toLocaleString('es-MX')} m³`
      },
      style: {
        fontSize: '12px',
      }
    },
    markers: {
      size: 0, 
      hover: {
        size: 5, 
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { height: 300 },
          legend: { position: "bottom", horizontalAlign: "center", offsetY: 0 },
        },
      },
    ],
  };

  const chartElement = (
    <div className="relative w-full h-full min-h-[300px]">
      <Chart
        options={options}
        series={series}
        type="area"
        height="100%"
        width="100%"
        key={isDarkMode ? "dark" : "light"}
      />
    </div>
  );

  if (hideCardWrapper) {
    return chartElement;
  }

  return (
    <div className="w-full h-full min-h-[350px] p-5 rounded-2xl bg-white border shadow-sm border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 transition-colors duration-300">
      {chartElement}
    </div>
  );
};

export default LineChart;





