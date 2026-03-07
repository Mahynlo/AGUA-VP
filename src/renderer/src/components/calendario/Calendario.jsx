import React, { useState, useMemo } from "react";
import { Card, CardBody, Button, Chip, Badge } from "@nextui-org/react";
import { FlechaIzquierdaIcon, FlechaDerechaIcon } from "../../IconsApp/IconsAppSystem";
import { CalendarioHomeIcon } from "../../IconsApp/IconsHome";
import { HiChevronLeft, HiChevronRight, HiCalendar, HiClock } from "react-icons/hi";
import { useTarifas } from "../../context/TarifasContext";
import { obtenerFeriadosMexico } from "../../utils/diasHabiles";


const CalendarComponent = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const { tarifas } = useTarifas();

    // Detectar tamaño de pantalla
    React.useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handleDateChange = (dateString) => {
        setSelectedDate(dateString);
    };


    const events = useMemo(() => {
        const evts = {};

        // Eventos de tarifas
        tarifas.forEach((tarifa) => {
            const startDate = parseDate(tarifa.fecha_inicio);
            const startDateString = formatDateString(startDate);
            if (!evts[startDateString]) evts[startDateString] = [];
            evts[startDateString].push({
                title: `Inicio de tarifa: ${tarifa.nombre}`,
                descripcion: tarifa.descripcion,
                time: null,
                tipo: 'tarifa',
            });

            if (tarifa.fecha_fin) {
                const endDate = parseDate(tarifa.fecha_fin);
                const endDateString = formatDateString(endDate);
                if (!evts[endDateString]) evts[endDateString] = [];
                evts[endDateString].push({
                    title: `Fin de tarifa: ${tarifa.nombre}`,
                    descripcion: tarifa.descripcion,
                    time: null,
                    tipo: 'tarifa',
                });
            }
        });

        // Feriados mexicanos (año actual y adyacentes)
        const anio = currentMonth.getFullYear();
        [anio - 1, anio, anio + 1].forEach(a => {
            obtenerFeriadosMexico(a).forEach(f => {
                if (!evts[f.fecha]) evts[f.fecha] = [];
                evts[f.fecha].push({
                    title: f.nombre,
                    descripcion: 'Día feriado oficial — No hábil',
                    time: null,
                    tipo: 'feriado',
                });
            });
        });

        return evts;
    }, [tarifas, currentMonth]);

    // Función auxiliar para parsear fechas yyyy-mm-dd
    function parseDate(str) {
        const [year, month, day] = str.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }





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
        <div className="flex flex-col lg:flex-row w-full h-full gap-3 sm:gap-4 md:gap-6">
            {/* Calendario Principal */}
            <Card className="flex-1 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[500px] border-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl">
                <CardBody className="p-3 sm:p-4 md:p-6 h-full flex flex-col">
                    {/* Header del Calendario */}
                    <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 sm:p-2.5 rounded-xl shadow-lg">
                                <HiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                                    Calendario
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                                    Gestión de eventos y actividades
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Controles de Navegación */}
                    <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
                        <Button
                            isIconOnly
                            variant="bordered"
                            size="sm"
                            onClick={() => changeMonth(-1)}
                            className="border-gray-300 dark:border-gray-600"
                        >
                            <HiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                        
                        <div className="text-center">
                            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                                {currentMonth.toLocaleString("es-MX", { month: "long" })} {currentMonth.getFullYear()}
                            </h3>
                        </div>
                        
                        <Button
                            isIconOnly
                            variant="bordered"
                            size="sm"
                            onClick={() => changeMonth(1)}
                            className="border-gray-300 dark:border-gray-600"
                        >
                            <HiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
                        {["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"].map((day) => (
                            <div key={day} className="text-center py-1 sm:py-2 md:py-3">
                                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {day}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-0">
                        {daysInMonth.map(({ date, currentMonth }, index) => {
                            const dateString = formatDateString(date);
                            const hasEvents = hasEvent(date);
                            const todayDate = isToday(date);
                            const eventCount = hasEvents ? events[dateString].length : 0;
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            const hasFeriado = hasEvents && events[dateString].some(e => e.tipo === 'feriado');

                            return (
                                <div
                                    key={index}
                                    className={`
                                        relative min-h-[50px] sm:min-h-[70px] md:min-h-[90px] lg:min-h-[80px]
                                        p-1 sm:p-2 md:p-3 lg:p-2 rounded-lg cursor-pointer transition-all duration-200
                                        border-2 hover:scale-105 flex flex-col
                                        ${currentMonth
                                            ? todayDate
                                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg"
                                                : hasFeriado
                                                    ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-300 dark:border-red-700"
                                                    : hasEvents
                                                        ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-300 dark:border-green-700"
                                                        : isWeekend
                                                            ? "bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                                            : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                                        }
                                    `}
                                    onClick={() => handleDateChange(dateString)}
                                >
                                    <span className={`text-xs sm:text-sm md:text-base lg:text-sm font-semibold mb-auto ${
                                        todayDate ? "text-white" : 
                                        currentMonth ? "text-gray-900 dark:text-white" : 
                                        "text-gray-400 dark:text-gray-500"
                                    }`}>
                                        {date.getDate()}
                                    </span>
                                    
                                    {hasEvents && (
                                        <div className="mt-auto">
                                            <Chip
                                                size="sm"
                                                color={todayDate ? "default" : hasFeriado ? "danger" : "success"}
                                                variant="flat"
                                                className="text-[10px] sm:text-xs h-4 sm:h-5 min-w-[30px] sm:min-w-[40px]"
                                            >
                                                {eventCount}
                                            </Chip>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* Panel de Eventos - Siempre visible */}
            <Card className="w-full lg:w-80 xl:w-96 max-h-[300px] lg:max-h-full border-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl">
                <CardBody className="p-3 sm:p-4 md:p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1.5 sm:p-2 rounded-lg shadow-lg">
                            <HiClock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                                Eventos del Día
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                                {selectedDate ? (() => {
                                    const [year, month, day] = selectedDate.split("-");
                                    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
                                    return localDate.toLocaleDateString("es-MX", {
                                        timeZone: "America/Hermosillo",
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                    });
                                })() : "Selecciona una fecha"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {selectedDate && events[selectedDate] ? (
                            <div className="space-y-2 sm:space-y-3 overflow-y-auto h-full pr-1 sm:pr-2">
                                {events[selectedDate].map((event, index) => (
                                    <Card key={index} className={`border-none shadow-sm hover:shadow-md transition-all duration-200 ${
                                        event.tipo === 'feriado'
                                            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
                                            : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                                    }`}>
                                        <CardBody className="p-2 sm:p-3 md:p-4">
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                <Chip
                                                    size="sm"
                                                    color={event.tipo === 'feriado' ? 'danger' : event.tipo === 'tarifa' ? 'warning' : 'primary'}
                                                    variant="flat"
                                                    className="flex-shrink-0 capitalize"
                                                >
                                                    {event.tipo || 'evento'}
                                                </Chip>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                                        {event.title}
                                                    </h4>
                                                    {event.descripcion && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                            {event.descripcion}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-4 sm:py-8">
                                <div className="bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                                    <HiCalendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm md:text-base">
                                    {selectedDate ? "No hay eventos para este día" : "Selecciona una fecha para ver eventos"}
                                </p>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default CalendarComponent;


