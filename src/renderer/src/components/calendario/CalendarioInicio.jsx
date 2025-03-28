import React, { useState } from "react";

const events = {
    "2025-03-10": [{ time: "09:30 pm", title: "Products Introduction Meeting" }],
    "2025-03-12": [
        { time: "12:30 pm", title: "Client entertaining" },
        { time: "02:00 pm", title: "Product design discussion" }
    ],
    "2025-03-15": [
        { time: "05:00 pm", title: "Product test and acceptance" },
        { time: "06:30 pm", title: "Reporting" }
    ]
};

const CalendarInicio = () => {
    const [selectedDate, setSelectedDate] = useState("");
        const [currentMonth, setCurrentMonth] = useState(new Date());
    
        const handleDateChange = (date) => {
            setSelectedDate(date);
        };
    
        const getDaysInMonth = (date) => {
            const days = [];
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
            // Días del mes anterior
            const startDay = firstDay.getDay();
            const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
            for (let i = startDay - 1; i >= 0; i--) {
                const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, prevMonthLastDay - i);
                days.push({ date: prevDate, currentMonth: false });
            }
    
            // Días del mes actual
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
                days.push({ date: currentDate, currentMonth: true });
            }
    
            // Días del mes siguiente
            const remainingDays = 7 - (days.length % 7);
            if (remainingDays < 7) {
                for (let i = 1; i <= remainingDays; i++) {
                    const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, i);
                    days.push({ date: nextDate, currentMonth: false });
                }
            }
    
            return days;
        };
    
        const changeMonth = (direction) => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(currentMonth.getMonth() + direction);
            setCurrentMonth(newDate);
        };
    
        const hasEvent = (date) => {
            const dateString = date.toISOString().split("T")[0];
            return !!events[dateString];
        };
    
        const isToday = (date) => {
            const today = new Date();
            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );
        };
    
        const daysInMonth = getDaysInMonth(currentMonth);
    
        return (
           <>
            <div className="flex">
                {/* Calendario */}
                <div className=" w-full mt-5 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border ">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-gray-700 bg-gray-300 dark:bg-gray-800  dark:text-gray-300 border border-gray-300 rounded-full">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M5 12l4 4" /><path d="M5 12l4 -4" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100">
                            {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
                        </h2>
                        <button onClick={() => changeMonth(1)} className="p-2 text-gray-700 bg-gray-300 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 rounded-full">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-narrow-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M15 16l4 -4" /><path d="M15 8l4 4" /></svg>
                        </button>
                    </div>
    
                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-700 dark:text-gray-100">
                        {["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"].map((day) => (
                            <div key={day} className="py-2">{day}</div>
                        ))}
                    </div>
    
                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map(({ date, currentMonth }, index) => {
                            const dateString = date.toISOString().split("T")[0];
    
                            return (
                                <div
                                    key={index}
                                    className={`text-center p-2 rounded-lg cursor-pointer transition-all
                                        ${
                                            currentMonth
                                                ? isToday(date)
                                                    ? "bg-green-500 text-white font-bold" // Día actual resaltado
                                                    : hasEvent(date)
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-transparent"
                                                : "text-gray-400 dark:text-gray-500" // Días del mes anterior/siguiente
                                        }
                                        hover:bg-blue-200 dark:hover:bg-blue-500
                                    `}
                                    onClick={() => handleDateChange(dateString)}
                                >
                                    {date.getDate()}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                
            </div>
            <p className="mt-2">Corte de recibo</p>
            <p className="mt-2">Fechha Actual</p>
           </>
            

        );
    };

export default CalendarInicio;

