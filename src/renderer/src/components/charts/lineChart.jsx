import React, { useEffect, useState, useMemo } from "react";
import Chart from "react-apexcharts";

const LineChart = ({ data }) => {
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

  // Convierte "03-2026", "2026-03", "2026-03-01", números o nombres de mes a formato legible
  const formatearMes = (cadenaMes) => {
    if (cadenaMes === null || cadenaMes === undefined || cadenaMes === '') return '';
    const str = String(cadenaMes).trim();
    
    // Formatos con guion: YYYY-MM o MM-YYYY o YYYY-MM-DD
    const partes = str.split("-");
    if (partes.length >= 2) {
      const esAnioPrimero = partes[0].length === 4;
      const mesNum = parseInt(esAnioPrimero ? partes[1] : partes[0], 10);
      const anio = esAnioPrimero ? partes[0] : (partes[1].length === 4 ? partes[1] : (partes[2] || ''));
      
      if (!isNaN(mesNum) && mesNum >= 1 && mesNum <= 12) {
        const fecha = new Date(anio ? parseInt(anio, 10) : new Date().getFullYear(), mesNum - 1, 1);
        const nombreMes = fecha.toLocaleString("es-MX", { month: "short" });
        const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
        return anio ? `${mesCapitalizado} ${anio}` : mesCapitalizado;
      }
    }
    
    // Si es un número del 1 al 12
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= 12 && str.length <= 2) {
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return meses[num - 1];
    }

    return str;
  };

  const isDynamic = Array.isArray(data) && data.length > 0;

  const series = useMemo(() => {
    if (isDynamic) {
      return [{
        name: "Consumo Total",
        data: data.map(item => Number(item.total ?? item.consumo ?? item.valor ?? item.cantidad ?? 0))
      }];
    }
    return [
      {
        name: "Consumo Nácori Grande",
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
  }, [data, isDynamic]);

  const categories = useMemo(() => {
    if (isDynamic) {
      return data.map(item => formatearMes(item.mes || item.fecha || item.periodo || item.label || ''));
    }
    return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  }, [data, isDynamic]);

  const colors = isDarkMode
    ? ["#60a5fa", "#34d399", "#a78bfa"]
    : ["#2563eb", "#059669", "#7c3aed"];

  const options = useMemo(() => ({
    chart: {
      type: "area",
      height: 320,
      background: "transparent",
      fontFamily: "inherit",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      zoom: { enabled: true },
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
    },
    colors: colors,
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: isDarkMode ? 0.4 : 0.3,
        opacityTo: 0.05,
        stops: [0, 95, 100]
      }
    },
    grid: {
      borderColor: isDarkMode ? "#27272a" : "#e2e8f0",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 12, bottom: 0, left: 12 }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDarkMode ? "#a1a1aa" : "#64748b",
          fontSize: "12px",
          fontWeight: 500,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
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
        formatter: (val) => {
          if (val == null) return "0";
          return `${Number(val).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
        }
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      offsetY: -5,
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
      x: { show: true },
      y: {
        formatter: (val) => `${Number(val || 0).toLocaleString("es-MX")} m³`
      }
    },
    markers: {
      size: isDynamic && data.length <= 1 ? 5 : 3,
      colors: isDarkMode ? ["#60a5fa", "#34d399", "#a78bfa"] : ["#2563eb", "#059669", "#7c3aed"],
      strokeColors: isDarkMode ? "#18181b" : "#ffffff",
      strokeWidth: 2,
      hover: {
        size: 6,
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { height: 280 },
          legend: { position: "bottom", horizontalAlign: "center", offsetY: 0 },
        },
      },
    ],
  }), [isDarkMode, categories, colors, isDynamic, data]);

  return (
    <div className="w-full h-full min-h-[320px] flex items-center justify-center">
      <div className="relative w-full h-[320px]">
        <Chart
          options={options}
          series={series}
          type="area"
          height={320}
          width="100%"
          key={isDarkMode ? "dark" : "light"}
        />
      </div>
    </div>
  );
};

export default LineChart;
