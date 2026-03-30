import React, { useState, useMemo } from "react";
import { FlechaIzquierdaIcon, FlechaDerechaIcon } from "../../IconsApp/IconsAppSystem";
import { CalendarioHomeIcon } from "../../IconsApp/IconsHome";
import { obtenerFeriadosMexico } from "../../utils/diasHabiles";

const CalendarInicio = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Generar feriados para el año visible
    const feriadosMap = useMemo(() => {
        const anio = currentMonth.getFullYear();
        const map = {};
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

    // Array estático de días para renderizado más limpio
    const diasSemana = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4 sm:p-5 lg:p-6 transition-colors duration-300 overflow-hidden">
            
            {/* Cabecera del Calendario (flex-shrink-0) */}
            <div className="flex justify-between items-start mb-4 sm:mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                        Calendario
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        Días hábiles y feriados
                    </p>
                </div>
                <div className="bg-orange-500/10 dark:bg-orange-500/20 p-2 sm:p-2.5 rounded-xl text-orange-600 dark:text-orange-500">
                    <CalendarioHomeIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                </div>
            </div>

            {/* Controles de Navegación de Mes (flex-shrink-0) */}
            <div className="flex justify-between items-center mb-4 px-1 flex-shrink-0">
                <button 
                    onClick={() => changeMonth(-1)} 
                    className="p-1.5 sm:p-2 lg:p-2.5 text-slate-600 dark:text-zinc-400 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Mes anterior"
                >
                    <FlechaIzquierdaIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
                
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-700 dark:text-zinc-200 capitalize">
                    {currentMonth.toLocaleString("es-MX", { month: "long" })} {currentMonth.getFullYear()}
                </h3>
                
                <button 
                    onClick={() => changeMonth(1)} 
                    className="p-1.5 sm:p-2 lg:p-2.5 text-slate-600 dark:text-zinc-400 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Mes siguiente"
                >
                    <FlechaDerechaIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
            </div>

            {/* Cuadrícula del Calendario */}
            <div className="flex-1 flex flex-col min-h-0">
                
                {/* Cabecera de días de la semana (flex-shrink-0) */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2 flex-shrink-0">
                    {diasSemana.map((day) => (
                        <div key={day} className="text-center py-1 text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Días del mes (auto-rows-fr para llenar el alto sin scroll) */}
                <div className="grid grid-cols-7 auto-rows-fr gap-1 sm:gap-2 flex-1 min-h-0">
                    {daysInMonth.map(({ date, currentMonth: isCurrentMonth }, index) => {
                        const dateString = formatDateString(date);
                        const isFeriado = !!feriadosMap[dateString];
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const today = isToday(date);
                        const isSelected = selectedDate === dateString;

                        return (
                            <button
                                key={index}
                                onClick={() => handleDateChange(dateString)}
                                title={isFeriado ? feriadosMap[dateString] : isWeekend ? 'Fin de semana' : ''}
                                className={`
                                    relative flex flex-col items-center justify-start pt-1 sm:pt-2 pb-1.5
                                    w-full h-full rounded-lg sm:rounded-xl 
                                    text-xs sm:text-sm lg:text-base font-medium 
                                    transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                    ${!isCurrentMonth 
                                        ? "text-slate-300 dark:text-zinc-600 opacity-40 cursor-not-allowed bg-transparent"
                                        : isSelected
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold scale-[1.02] z-10"
                                            : today
                                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold ring-2 ring-blue-500 ring-inset"
                                                : isFeriado
                                                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                                    : isWeekend
                                                        ? "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30"
                                                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                    }
                                `}
                                disabled={!isCurrentMonth}
                            >
                                <span>{date.getDate()}</span>
                                
                                {/* Puntito indicador para Feriados (mt-auto lo empuja abajo) */}
                                {isCurrentMonth && isFeriado && (
                                    <span className={`
                                        mt-auto w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full
                                        ${isSelected ? "bg-white" : "bg-red-500"}
                                    `}></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            
        </div>
    );
};

export default CalendarInicio;

