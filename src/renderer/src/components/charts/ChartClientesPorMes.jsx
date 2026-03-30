import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ClientesPorMesChart = ({ 
  clientes = [], 
  data = null, 
  esDataServidor = false, 
  mostrarMesCompleto = false,
  titulo = "Clientes Registrados por Mes",
  colorPersonalizado = "#00BAEC",
  isDarkMode = false
}) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    let registrosPorMes = [];
    let categorias = [];

    // --- LÓGICA DE DATOS ---
    if (esDataServidor && data) {
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('ChartClientesPorMes: data no es válido', data);
        return;
      }
      
      registrosPorMes = data.map(item => item?.cantidad || 0);
      categorias = data.map(item => {
        const mes = item?.mes || '';
        if (mostrarMesCompleto && mes.includes('-')) {
          const [año, mesNum] = mes.split('-');
          const fecha = new Date(año, parseInt(mesNum) - 1);
          return fecha.toLocaleString("es-MX", { month: "short", year: "numeric" }).toUpperCase();
        } else {
          return mes.toUpperCase();
        }
      });
    } else {
      const ahora = new Date();
      const mesActual = ahora.getMonth();

      for (let i = 0; i <= mesActual; i++) {
        registrosPorMes.push(0);
        categorias.push(
          new Date(0, i).toLocaleString("es-MX", { month: "short" }).toUpperCase()
        );
      }

      if (Array.isArray(clientes) && clientes.length > 0) {
        clientes.forEach((c) => {
          if (c?.fecha_creacion) {
            try {
              const fecha = new Date(c.fecha_creacion.replace(" ", "T"));
              const mes = fecha.getMonth();
              if (mes <= mesActual && !isNaN(mes)) {
                registrosPorMes[mes]++;
              }
            } catch (error) {
              console.warn('Error procesando fecha:', c.fecha_creacion);
            }
          }
        });
      }
    }
    
    if (!registrosPorMes.length || !categorias.length) return;

    const textColor = isDarkMode ? "#a1a1aa" : "#64748b";
    const gridColor = isDarkMode ? "#27272a" : "#f1f5f9";

    // --- CONFIGURACIÓN VISUAL ---
    const options = {
      // ESTO ES LO QUE FALTABA: LA DATA
      series: [
        {
          name: (() => {
            if (!esDataServidor) return "Clientes";
            if (!categorias.length || !categorias[0]) return "Clientes";
            const categoria = String(categorias[0]);
            const esMes = /[A-Za-z]/.test(categoria);
            return esMes ? "Clientes" : "Cantidad";
          })(),
          data: registrosPorMes,
        },
      ],
      chart: {
        type: "bar",
        height: "100%", 
        minHeight: 300,
        fontFamily: 'inherit', // Hereda la fuente de tu proyecto
        background: "transparent",
        toolbar: {
          show: false, 
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      colors: [colorPersonalizado],
      plotOptions: {
        bar: {
          borderRadius: 6,
          borderRadiusApplication: 'end', 
          columnWidth: "45%",   
          dataLabels: {
            position: 'top', 
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: isDarkMode ? 'dark' : 'light',
          type: "vertical",
          shadeIntensity: 0.25,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 0.7,
          stops: [50, 100],
        }
      },
      dataLabels: {
        enabled: true,
        offsetY: -20, 
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          colors: [isDarkMode ? "#e4e4e7" : "#334155"] 
        },
        formatter: function (val) {
          return val > 0 ? val : ""; // Oculta los ceros
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categorias,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: textColor,
            fontSize: '11px',
            fontWeight: 500,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: textColor,
            fontSize: '11px',
          },
          formatter: (value) => { return Math.round(value) } 
        },
      },
      grid: {
        show: true,
        borderColor: gridColor,
        strokeDashArray: 4,
        position: 'back',
        xaxis: { lines: { show: false } }, 
        yaxis: { lines: { show: true } },
        padding: { top: 0, right: 0, bottom: 0, left: 10 },
      },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        y: {
          formatter: function (val) {
            return val + (val === 1 ? " cliente" : " clientes");
          }
        },
      },
      title: {
        text: titulo,
        align: "left", 
        margin: 20,
        offsetX: 10,
        style: {
          fontSize: "16px",
          fontWeight: 700,
          color: isDarkMode ? "#f4f4f5" : "#1e293b",
        },
      },
      responsive: [
        {
          breakpoint: 768, 
          options: {
            plotOptions: {
              bar: { columnWidth: "65%" }
            },
            xaxis: {
              labels: {
                rotate: -45,
                style: { fontSize: '10px' }
              }
            }
          }
        }
      ]
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => chart.destroy();
  }, [clientes, data, esDataServidor, mostrarMesCompleto, titulo, colorPersonalizado, isDarkMode]);

  return (
    <div className="w-full h-full min-h-[320px] bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 p-4">
      <div ref={chartRef} className="h-full w-full" />
    </div>
  );
};

export default ClientesPorMesChart;
