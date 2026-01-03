import Chart from "react-apexcharts";

const PieChart = ({ data, unit = "" }) => {
  // Procesar datos o usar defaults
  const chartData = data && data.length > 0
    ? {
      series: data.map(item => item.cantidad),
      labels: data.map(item => item.estado)
    }
    : {
      series: [123, 180, 300],
      labels: ["Nacori", "Matape", "Adivino"]
    };

  const options = {
    chart: {
      type: "pie",
    },
    labels: chartData.labels,
    legend: {
      position: "top",
    },
    colors: [
      "rgba(255, 99, 132, 0.6)",
      "rgba(54, 162, 235, 0.6)",
      "rgba(255, 206, 86, 0.6)",
      "rgba(75, 192, 192, 0.6)",
      "rgba(153, 102, 255, 0.6)"
    ],
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => `${val} ${unit}`
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            width: "100%",
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <Chart options={options} series={chartData.series} type="pie" width="100%" height="100%" />
  );
};

export default PieChart;




