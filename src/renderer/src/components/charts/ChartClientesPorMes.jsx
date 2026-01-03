import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ClientesPorMesChart = ({ 
  clientes = [], 
  data = null, 
  esDataServidor = false, 
  mostrarMesCompleto = false,
  titulo = "Clientes Registrados por Mes",
  colorPersonalizado = "#00BAEC"
}) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    let registrosPorMes = [];
    let categorias = [];

    if (esDataServidor && data) {
      // Validar que data sea un array válido
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('ChartClientesPorMes: data no es válido', data);
        return;
      }
      
      // Usar datos del servidor
      registrosPorMes = data.map(item => item?.cantidad || 0);
      categorias = data.map(item => {
        const mes = item?.mes || '';
        if (mostrarMesCompleto && mes.includes('-')) {
          // Formato YYYY-MM -> "Agosto 2025"
          const [año, mesNum] = mes.split('-');
          const fecha = new Date(año, parseInt(mesNum) - 1);
          return fecha.toLocaleString("es-MX", { month: "long", year: "numeric" });
        } else {
          // Mes corto o nombre directo
          return mes;
        }
      });
    } else {
      // Cálculo local desde array de clientes
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
    
    // Validar que tenemos datos antes de crear el gráfico
    if (!registrosPorMes.length || !categorias.length) {
      console.warn('ChartClientesPorMes: No hay datos para renderizar');
      return;
    }

    const chart = new ApexCharts(chartRef.current, {
      chart: {
        type: "bar",
        height: 320,
        foreColor: "#333",
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            chart: {
              height: 280,
            },
            plotOptions: {
              bar: {
                columnWidth: "60%",
              },
            },
            xaxis: {
              labels: {
                rotate: -45,
                style: {
                  fontSize: '10px',
                }
              }
            }
          },
        },
        {
          breakpoint: 640,
          options: {
            chart: {
              height: 250,
            },
            plotOptions: {
              bar: {
                columnWidth: "70%",
              },
            },
            xaxis: {
              labels: {
                rotate: -45,
                style: {
                  fontSize: '9px',
                }
              }
            }
          },
        },
      ],
      title: {
        text: titulo,
        align: "center",
        style: {
          fontSize: "18px",
          fontWeight: "bold",
          color: colorPersonalizado,
        },
      },
      series: [
        {
          name: (() => {
            if (!esDataServidor) return "Clientes";
            if (!categorias.length || !categorias[0]) return "Clientes";
            const categoria = String(categorias[0]);
            // Si parece un mes (letras mayúsculas/minúsculas), es "Clientes", si no "Cantidad"
            const esMes = /[A-Za-z]/.test(categoria);
            return esMes ? "Clientes" : "Cantidad";
          })(),
          data: registrosPorMes,
        },
      ],
      xaxis: {
        categories: categorias,
        labels: {
          style: {
            fontWeight: 600,
            fontSize: '11px',
          },
          trim: true,
          hideOverlappingLabels: true,
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
          },
        },
      },
      colors: [colorPersonalizado],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
        }
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return val + " clientes"
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1',
        strokeDashArray: 4,
      }
    });

    chart.render();

    return () => chart.destroy();
  }, [clientes, data, esDataServidor, mostrarMesCompleto]);

  return (
    <div className="w-full h-full">
      <div ref={chartRef} className="h-full" />
    </div>
  );
};

export default ClientesPorMesChart;
