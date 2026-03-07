import React, { useState, useMemo } from "react";
import { FlechaIzquierdaIcon, FlechaDerechaIcon } from "../../IconsApp/IconsAppSystem";
import { Chip } from "@nextui-org/chip";
import { CalendarioHomeIcon } from "../../IconsApp/IconsHome";
import { obtenerFeriadosMexico, esFeriado } from "../../utils/diasHabiles";

const CalendarInicio = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Generar feriados para el año visible
    const feriadosMap = useMemo(() => {
        const anio = currentMonth.getFullYear();
        const map = {};
        // Incluir año actual y adyacentes (para días de meses previos/siguientes)
        [anio - 1, anio, anio + 1].forEach(a => {
            obtenerFeriadosMexico(a).forEach(f => {
                map[f.fecha] = f.nombre;
            });
        });
        return map;
    }, [currentMonth]);

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
        const dateString = formatDateString(date);
        return !!feriadosMap[dateString];
    };

    const formatDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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
            <div className="flex w-full h-full">
                {/* Calendario */}
                <div className="w-full p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg  flex flex-col h-full min-h-[250px] max-h-[90vh]">
                    {/*Titulo del calaendario e icono */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <p className="text-3xl text-gray-600 dark:text-gray-100  font-bold tracking-wide">Calendario</p>

                        </div>
                        <div className="bg-orange-500 p-2 md:p-1 xl:p-2 rounded-md text-white h-full">
                            <CalendarioHomeIcon className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 h-[40px] mt-4">

                        <button onClick={() => changeMonth(-1)} className="p-2 text-gray-700 bg-gray-300 dark:bg-gray-800  dark:text-gray-300 border border-gray-300 rounded-full">
                            <FlechaIzquierdaIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100">
                            {currentMonth.toLocaleString("es-MX", { month: "long" })} {currentMonth.getFullYear()}
                        </h2>
                        <button onClick={() => changeMonth(1)} className="p-2 text-gray-700 bg-gray-300 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 rounded-full">
                            <FlechaDerechaIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-100 h-[30px]">


                        {["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"].map((day) => (
                            <div key={day} className="py-2">{day}</div>
                        ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2  flex-1 overflow-auto">

                        {daysInMonth.map(({ date, currentMonth }, index) => {
                            const dateString = formatDateString(date);
                            const isFeriado = !!feriadosMap[dateString];
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            return (
                                <div
                                    key={index}
                                    className={`w-full flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all 
                                        ${currentMonth
                                            ? isToday(date)
                                                ? "bg-green-500 text-white font-bold"
                                                : isFeriado
                                                    ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold"
                                                    : isWeekend
                                                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                                        : "bg-transparent"
                                            : "text-gray-400 dark:text-gray-500"
                                        }
                                        hover:bg-blue-200 dark:hover:bg-blue-500 
                                    `}
                                    onClick={() => handleDateChange(dateString)}
                                    title={isFeriado ? feriadosMap[dateString] : isWeekend ? 'Fin de semana' : ''}
                                >
                                    <span className="text-xs sm:text-sm">{date.getDate()}</span>
                                    {isFeriado && currentMonth && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5"></span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>


            </div>



        </>


    );
};

export default CalendarInicio;

