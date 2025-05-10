import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import ReporteLecturas from "../recibo/ReporteLecturas";
const Ayuda = () => {


  return (
    <div className="  mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        Ayuda

      </div>

      <Link to="/pantallaCarga">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Pantalla de Carga
        </button>
      </Link>

      




    </div>
  )
};

export default Ayuda;
