import Chart from "react-apexcharts";

const PieChart = () => {
  const series = [123, 180, 300]; // Valores

  const options = {
    chart: {
      type: "pie",
    },
    labels: ["Nacori", "Matape", "Adivino"],
    legend: {
      position: "top",
    },
    colors: [
      "rgba(255, 99, 132, 0.6)",
      "rgba(54, 162, 235, 0.6)",
      "rgba(255, 206, 86, 0.6)",
    ],
    tooltip: {
      enabled: true,
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
    <Chart options={options} series={series} type="pie" width="100%" height="100%" />
  );
};

export default PieChart;




