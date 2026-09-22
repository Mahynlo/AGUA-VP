import React from "react";
import {
  HiUsers,
  HiCog,
  HiChartBar,
  HiCurrencyDollar,
  HiPrinter,
  HiQuestionMarkCircle,
  HiDocumentText,
  HiCalculator,
  HiChip,
  HiShieldCheck
} from "react-icons/hi";

export const sectionIcons = {
  clientes: {
    icon: <HiUsers className="w-5 h-5" />,
    color: "primary",
    title: "Clientes",
    subtitle: "Padrón de usuarios, contratos y predios",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40",
    accentColor: "blue"
  },
  medidores: {
    icon: <HiChip className="w-5 h-5" />,
    color: "primary",
    title: "Medidores",
    subtitle: "Inventario de hardware, asignación y estado",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40",
    accentColor: "sky"
  },
  lecturas: {
    icon: <HiChartBar className="w-5 h-5" />,
    color: "warning",
    title: "Lecturas",
    subtitle: "Rutas por sector, captura de consumos y avance",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
    accentColor: "amber"
  },
  facturas: {
    icon: <HiDocumentText className="w-5 h-5" />,
    color: "secondary",
    title: "Facturas",
    subtitle: "Emisión de cargos y desglose mensual",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40",
    accentColor: "indigo"
  },
  pagos: {
    icon: <HiCurrencyDollar className="w-5 h-5" />,
    color: "success",
    title: "Pagos y Cobranza",
    subtitle: "Recaudación FIFO, recibos de pago y convenios",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
    accentColor: "emerald"
  },
  tarifas: {
    icon: <HiCalculator className="w-5 h-5" />,
    color: "success",
    title: "Tarifas",
    subtitle: "Catálogo por rangos y simulador de cobro",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40",
    accentColor: "emerald"
  },
  impresion: {
    icon: <HiPrinter className="w-5 h-5" />,
    color: "secondary",
    title: "Impresión",
    subtitle: "Emisión masiva de boletas y reportes PDF",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40",
    accentColor: "indigo"
  },
  configuracion: {
    icon: <HiShieldCheck className="w-5 h-5" />,
    color: "default",
    title: "Administración",
    subtitle: "Seguridad, usuarios, backups y logs",
    badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/40",
    accentColor: "slate"
  },
  faq: {
    icon: <HiQuestionMarkCircle className="w-5 h-5" />,
    color: "warning",
    title: "Preguntas Frecuentes",
    subtitle: "Soluciones rápidas y procedimientos frecuentes",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40",
    accentColor: "amber"
  }
};
