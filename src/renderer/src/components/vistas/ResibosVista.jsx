import React from "react";
import CalendarComponent from "../calendario/Calendario";
import { TarifaIcon, LecturasIcon, PagosIcon, ImpresionResibosIcon, HistorialResibosIcon } from "../../IconsApp/IconsResibos";
import { useLocation, Link } from "react-router-dom";
const Resibos = () => {
  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">

      <section className="block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 w-full h-full overflow-x-hidden">
        <CalendarComponent />
      </section>
      
     

    </div>
  )
};

export default Resibos;
