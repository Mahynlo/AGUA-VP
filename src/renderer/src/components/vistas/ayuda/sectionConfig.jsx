import React from "react";
import {
  HiUsers,
  HiCog,
  HiChartBar,
  HiCurrencyDollar,
  HiPrinter,
  HiQuestionMarkCircle
} from "react-icons/hi";

export const sectionIcons = {
  clientes: { icon: <HiUsers className="w-5 h-5" />, color: "success", title: "Clientes" },
  medidores: { icon: <HiCog className="w-5 h-5" />, color: "warning", title: "Medidores" },
  lecturas: { icon: <HiChartBar className="w-5 h-5" />, color: "secondary", title: "Lecturas" },
  facturas: { icon: <HiCurrencyDollar className="w-5 h-5" />, color: "danger", title: "Facturas" },
  pagos: { icon: <HiCurrencyDollar className="w-5 h-5" />, color: "primary", title: "Pagos" },
  impresion: { icon: <HiPrinter className="w-5 h-5" />, color: "secondary", title: "Impresión" },
  configuracion: { icon: <HiCog className="w-5 h-5" />, color: "default", title: "Configuración" },
  faq: { icon: <HiQuestionMarkCircle className="w-5 h-5" />, color: "warning", title: "FAQ" },
  tarifas: { icon: <HiCurrencyDollar className="w-5 h-5" />, color: "secondary", title: "Tarifas" }
};
