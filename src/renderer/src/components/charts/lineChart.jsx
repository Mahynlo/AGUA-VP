import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Title,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const LineChart = () => {
    const data = {
        labels: [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ],
        datasets: [
            {
                label: "Consumo Nacori Grande",
                data: [120, 150, 100, 200, 250, 300, 220, 190, 230, 280, 260, 240],
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 2,
                tension: 0.4,
            },
            {
                label: "Consumo Matape",
                data: [110, 140, 90, 180, 230, 290, 200, 180, 210, 260, 240, 220],
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderWidth: 2,
                tension: 0.4,
            },
            {
                label: "Consumo Adivino",
                data: [210, 240, 190, 280, 330, 250, 282, 286, 310, 260, 640, 720],
                borderColor: "rgb(54, 235, 117)",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 2,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Consumo del Municipio",
                color: "rgba(75, 192, 192, 1)",
                font: { size: 20, weight: "bold", family: "Arial" },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Meses",
                    color: "rgba(75, 192, 192, 1)",
                    font: { size: 16, weight: "bold", family: "Arial" },
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Consumo (metros cúbicos)",
                    color: "rgba(75, 192, 192, 1)",
                    font: { size: 16, weight: "bold", family: "Arial" },
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="flex items-center justify-center  p-3 rounded-lg bg-white border shadow border-gray-200 dark:border-gray-700 dark:bg-gray-800 w-full h-full">
            <div className="relative w-full h-full">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default LineChart;


