import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LineChart from "../charts/lineChart";
import PieChart from "../charts/piechart";
import { Calendar } from "@nextui-org/calendar";
import {today, getLocalTimeZone} from "@internationalized/date";
const Ayuda = () => {

  return (
    <div className="  mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        Ayuda

      </div>

     



    </div>
  )
};

export default Ayuda;
