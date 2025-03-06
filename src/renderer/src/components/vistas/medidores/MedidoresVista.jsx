import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MapaMedidores from "../../mapa/MapaMedidores";
const Medidores =  () => {
  
  return (
    <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        Medidores

      </div>
      <MapaMedidores/>
      
    </div>
  )
};

export default Medidores;