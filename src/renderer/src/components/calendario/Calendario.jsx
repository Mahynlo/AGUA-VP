import React, { useState, useMemo, useEffect } from "react";
import { Card, CardBody, Button, Chip } from "@nextui-org/react";
import { HiChevronLeft, HiChevronRight, HiCalendar, HiClock } from "react-icons/hi";
import { useTarifas } from "../../context/TarifasContext";
import { obtenerFeriadosMexico, esDiaHabil } from "../../utils/diasHabiles";
import { formatearPeriodo } from "../../utils/periodoUtils";

const CalendarComponent = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [diasGracia, setDiasGracia] = useState(0);
    // Fechas clave por período (incluye períodos anteriores), no solo el actual.
    const [facturasPeriodos, setFacturasPeriodos] = useState([]);
    const { tarifas } = useTarifas();

    // Cuántos meses hacia atrás se cargan en el calendario.
    const MESES_HISTORIAL = 12;

    // Días de gracia configurados para cortes (vencimiento + gracia = inicio de corte)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || !window.api?.deudores?.fetchConfiguracion) return;
        window.api.deudores
            .fetchConfiguracion(token)
            .then((cfg) => {
                if (cfg && Number.isFinite(Number(cfg.dias_gracia))) {
                    setDiasGracia(Number(cfg.dias_gracia));
                }
            })
            .catch(() => { /* config opcional: si falla, corte = vencimiento */ });
    }, []);

    // Carga las fechas clave (emisión, lectura, vencimiento) de los últimos
    // MESES_HISTORIAL períodos. Pide 1 factura por período como representante y
    // usa pagination.total para el conteo, manteniendo la transferencia mínima.
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || !window.api?.fetchFacturas) return;
        let cancelado = false;

        const cargar = async () => {
            const base = new Date();
            const periodos = [];
            for (let i = 0; i < MESES_HISTORIAL; i++) {
                const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
                periodos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
            }

            const resultados = await Promise.all(
                periodos.map(async (periodo) => {
                    try {
                        const resp = await window.api.fetchFacturas(token, { periodo, page: 1, limit: 1 });
                        const lista = Array.isArray(resp) ? resp : (resp?.facturas || []);
                        if (!lista.length) return null;
                        const f = lista[0];
                        return {
                            periodo,
                            count: resp?.pagination?.total ?? lista.length,
                            fechaEmision: f.fecha_emision,
                            fechaLectura: f.fecha_lectura,
                            fechaVencimiento: f.fecha_vencimiento,
                        };
                    } catch {
                        return null;
                    }
                })
            );

            if (!cancelado) setFacturasPeriodos(resultados.filter(Boolean));
        };

        cargar();
        return () => { cancelado = true; };
    }, []);

    const extractIsoDate = (value) => {
        if (!value || typeof value !== "string") return null;
        return value.length >= 10 ? value.substring(0, 10) : null;
    };

    // Suma días a una fecha ISO (YYYY-MM-DD) y devuelve otra fecha ISO
    const addDaysIso = (iso, days) => {
        if (!iso) return null;
        const [y, m, d] = iso.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + days);
        return formatDateString(dt);
    };

    const handleDateChange = (dateString) => {
        setSelectedDate(dateString);
    };

    const events = useMemo(() => {
        const evts = {};

        const pushEvent = (fecha, evento) => {
            if (!fecha) return;
            if (!evts[fecha]) evts[fecha] = [];
            evts[fecha].push(evento);
        };

        // Fechas clave del ciclo de facturación por período (incluye anteriores):
        // emisión, toma de lectura, vencimiento de recibos e inicio de corte.
        facturasPeriodos.forEach((info) => {
            const etiqueta = formatearPeriodo(info.periodo) || info.periodo;
            const plural = info.count === 1 ? 'recibo' : 'recibos';

            // Emisión de recibos del período
            pushEvent(extractIsoDate(info.fechaEmision), {
                title: `Emisión de recibos — ${etiqueta}`,
                descripcion: `${info.count} ${plural} emitidos en el período.`,
                tipo: 'emision',
                color: 'secondary',
            });

            // Toma de lectura del período
            pushEvent(extractIsoDate(info.fechaLectura), {
                title: `Toma de lectura — ${etiqueta}`,
                descripcion: `Lectura de medidores del período. ${info.count} ${plural} en este ciclo.`,
                tipo: 'lectura',
                color: 'success',
            });

            // Vencimiento de los recibos del período
            const fechaVencimiento = extractIsoDate(info.fechaVencimiento);
            if (fechaVencimiento) {
                pushEvent(fechaVencimiento, {
                    title: `Vencimiento de recibos — ${etiqueta}`,
                    descripcion: `Fecha límite de pago de los ${info.count} ${plural} del período.`,
                    tipo: 'vencimiento',
                    color: 'primary',
                });

                // Inicio de corte = vencimiento + días de gracia
                pushEvent(addDaysIso(fechaVencimiento, diasGracia), {
                    title: `Inicio de corte — ${etiqueta}`,
                    descripcion: diasGracia > 0
                        ? `Inicia el proceso de corte para recibos no pagados (vencimiento + ${diasGracia} día${diasGracia === 1 ? '' : 's'} de gracia).`
                        : 'Inicia el proceso de corte para los recibos no pagados del período.',
                    tipo: 'corte',
                    color: 'danger',
                });
            }
        });

        // Eventos de tarifas
        if (tarifas && tarifas.length > 0) {
            tarifas.forEach((tarifa) => {
                if (tarifa.fecha_inicio) {
                    const startDate = parseDate(tarifa.fecha_inicio);
                    const startDateString = formatDateString(startDate);
                    if (!evts[startDateString]) evts[startDateString] = [];
                    evts[startDateString].push({
                        title: `Inicio: ${tarifa.nombre}`,
                        descripcion: tarifa.descripcion,
                        tipo: 'tarifa',
                        color: 'warning'
                    });
                }

                if (tarifa.fecha_fin) {
                    const endDate = parseDate(tarifa.fecha_fin);
                    const endDateString = formatDateString(endDate);
                    if (!evts[endDateString]) evts[endDateString] = [];
                    evts[endDateString].push({
                        title: `Fin: ${tarifa.nombre}`,
                        descripcion: tarifa.descripcion,
                        tipo: 'tarifa',
                        color: 'warning'
                    });
                }
            });
        }

        // Feriados mexicanos (año actual y adyacentes)
        const anio = currentMonth.getFullYear();
        [anio - 1, anio, anio + 1].forEach(a => {
            obtenerFeriadosMexico(a).forEach(f => {
                if (!evts[f.fecha]) evts[f.fecha] = [];
                evts[f.fecha].push({
                    title: f.nombre,
                    descripcion: 'Día feriado oficial — No hábil',
                    tipo: 'feriado',
                    color: 'danger'
                });
            });
        });

        return evts;
    }, [facturasPeriodos, tarifas, currentMonth, diasGracia]);

    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];

        const [y, m, d] = selectedDate.split("-").map(Number);
        const selectedDateObj = new Date(y, m - 1, d);
        const dayEvents = [...(events[selectedDate] || [])];
        const isWeekend = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;
        const hasHoliday = dayEvents.some(evt => evt.tipo === "feriado");

        if (isWeekend) {
            dayEvents.push({
                title: "Fin de semana",
                descripcion: "Día inhábil para emisión y vencimientos automáticos",
                tipo: "inhabil",
                color: "default"
            });
        } else if (hasHoliday) {
            dayEvents.push({
                title: "Día inhábil",
                descripcion: "Fecha no hábil por feriado oficial",
                tipo: "inhabil",
                color: "default"
            });
        } else if (esDiaHabil(selectedDateObj)) {
            dayEvents.push({
                title: "Día hábil",
                descripcion: "Fecha hábil para operaciones de facturación",
                tipo: "habil",
                color: "success"
            });
        }

        return dayEvents;
    }, [selectedDate, events]);

    function parseDate(str) {
        if (!str) return new Date();
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

        const startDay = firstDay.getDay();
        const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ 
                date: new Date(date.getFullYear(), date.getMonth() - 1, prevMonthLastDay - i), 
                isCurrentMonth: false 
            });
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ 
                date: new Date(date.getFullYear(), date.getMonth(), i), 
                isCurrentMonth: true 
            });
        }

        const remainingDays = 7 - (days.length % 7);
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                days.push({ 
                    date: new Date(date.getFullYear(), date.getMonth() + 1, i), 
                    isCurrentMonth: false 
                });
            }
        }

        return days;
    };

    const changeMonth = (direction) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(currentMonth.getMonth() + direction);
        setCurrentMonth(newDate);
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
    const diasSemana = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

    return (
        // CAMBIO CLAVE: Quitamos h-full forzado en móviles. Usamos min-h solo en pantallas pequeñas.
        <div className="flex flex-col lg:flex-row w-full lg:h-full gap-4 lg:gap-6 items-start">
            
            {/* ---------------- CALENDARIO PRINCIPAL ---------------- */}
            {/* CAMBIO CLAVE: Añadimos min-h-[400px] para móviles, manteniendo h-full para LG+ */}
            <Card className="flex-1 w-full min-h-[450px] lg:h-full border-none bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                <CardBody className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                    
                    <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                        <div className="bg-orange-500/10 dark:bg-orange-500/20 p-2.5 rounded-xl text-orange-600 dark:text-orange-500">
                            <HiCalendar className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                Calendario General
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                                Lecturas, vencimientos, cortes y días hábiles
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 bg-slate-50 dark:bg-zinc-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-zinc-800 flex-shrink-0">
                        <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            onClick={() => changeMonth(-1)}
                            className="text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 shadow-sm h-8 w-8 min-w-8"
                        >
                            <HiChevronLeft className="w-5 h-5" />
                        </Button>
                        
                        <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-zinc-200 capitalize">
                            {currentMonth.toLocaleString("es-MX", { month: "long" })} {currentMonth.getFullYear()}
                        </h3>
                        
                        <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            onClick={() => changeMonth(1)}
                            className="text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 shadow-sm h-8 w-8 min-w-8"
                        >
                            <HiChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 flex-shrink-0">
                        {diasSemana.map((day) => (
                            <div key={day} className="text-center py-1 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-500 tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr gap-1 sm:gap-2 flex-1 min-h-0">
                        {daysInMonth.map(({ date, isCurrentMonth }, index) => {
                            const dateString = formatDateString(date);
                            const dayEvents = events[dateString] || [];
                            const hasEvents = dayEvents.length > 0;
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            const today = isToday(date);
                            const isSelected = selectedDate === dateString;
                            const hasFeriado = dayEvents.some(e => e.tipo === 'feriado');

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleDateChange(dateString)}
                                    className={`
                                        relative flex flex-col items-center justify-start pt-1 sm:pt-2 pb-1.5
                                        w-full h-full rounded-lg sm:rounded-xl transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                        ${!isCurrentMonth 
                                            ? "opacity-40 cursor-not-allowed bg-transparent" 
                                            : isSelected
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02] z-10" 
                                                : today
                                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500 ring-inset" 
                                                    : hasFeriado
                                                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" 
                                                        : isWeekend
                                                            ? "bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800" 
                                                            : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50" 
                                        }
                                    `}
                                    disabled={!isCurrentMonth}
                                >
                                    <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-white' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    
                                    {isCurrentMonth && hasEvents && (
                                        <div className="mt-auto flex items-center gap-0.5 sm:gap-1">
                                            {dayEvents.slice(0, 3).map((evt, i) => (
                                                <span 
                                                    key={i} 
                                                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                                                        isSelected
                                                            ? "bg-white/90"
                                                            : evt.tipo === 'feriado' ? "bg-red-500"
                                                            : evt.tipo === 'corte' ? "bg-rose-600"
                                                            : evt.tipo === 'vencimiento' ? "bg-blue-500"
                                                            : evt.tipo === 'lectura' ? "bg-teal-500"
                                                            : evt.tipo === 'emision' ? "bg-violet-500"
                                                            : "bg-orange-500"
                                                    }`}
                                                ></span>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span className={`text-[8px] leading-none font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>+</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* ---------------- PANEL DE EVENTOS LATERAL ---------------- */}
            {/* CAMBIO CLAVE: En móviles le damos min-h fijo, en desktop (lg) recupera el h-full */}
            <Card className="w-full min-h-[300px] lg:min-h-0 lg:w-72 xl:w-80 border-none bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800 rounded-2xl flex-shrink-0">
                <CardBody className="p-4 sm:p-5 h-full flex flex-col">
                    
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
                        <div className="bg-purple-500/10 dark:bg-purple-500/20 p-2.5 rounded-xl text-purple-600 dark:text-purple-400">
                            <HiClock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                Eventos
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 capitalize">
                                {selectedDate ? (() => {
                                    const [y, m, d] = selectedDate.split("-");
                                    return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
                                        weekday: "short", month: "short", day: "numeric"
                                    });
                                })() : "Elige un día"}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-[180px] max-h-[420px]">
                        {selectedDate && selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map((event, index) => (
                                <div 
                                    key={index} 
                                    className={`
                                        p-3 sm:p-4 rounded-xl border transition-all duration-200
                                        ${event.tipo === 'feriado'
                                            ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                            : event.tipo === 'corte'
                                                ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'
                                                : event.tipo === 'vencimiento'
                                                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                                                    : event.tipo === 'lectura'
                                                        ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30'
                                                        : event.tipo === 'emision'
                                                            ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30'
                                                            : event.tipo === 'habil'
                                                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                                                : event.tipo === 'inhabil'
                                                                    ? 'bg-slate-100/80 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700'
                                                                    : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                                            {event.title}
                                        </h4>
                                    </div>
                                    <Chip size="sm" color={event.color} variant="flat" className="h-4 px-1 text-[9px] font-semibold uppercase mb-2">
                                        {event.tipo === 'vencimiento' ? 'Vencimiento'
                                            : event.tipo === 'corte' ? 'Corte'
                                            : event.tipo === 'lectura' ? 'Lectura'
                                            : event.tipo === 'feriado' ? 'Feriado'
                                            : event.tipo === 'emision' ? 'Emisión'
                                            : event.tipo === 'habil' ? 'Hábil'
                                            : event.tipo === 'inhabil' ? 'Inhábil'
                                            : 'Tarifa'}
                                    </Chip>
                                    {event.descripcion && (
                                        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                                            {event.descripcion}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-6 opacity-60">
                                <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-full mb-3">
                                    <HiCalendar className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                                    {selectedDate ? "No hay eventos" : "Selecciona una fecha"}
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

