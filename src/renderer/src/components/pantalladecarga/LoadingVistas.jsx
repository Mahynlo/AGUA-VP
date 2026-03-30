// src/components/PantallaCarga.jsx
import React, { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/react";
import { IoWaterOutline } from "react-icons/io5";

const LoadingVistas = ({ tiempo = 5000, onFinalizado, titulo = "Cargando", mensaje = "Preparando el entorno..." }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinalizado) onFinalizado();
    }, tiempo);

    return () => clearTimeout(timer);
  }, [tiempo, onFinalizado]);

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 dark:bg-zinc-950 animate-in fade-in duration-500 z-50">
      
      {/* Contenedor del Spinner con efecto de brillo (Glow) */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Halo de luz de fondo */}
        <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Caja de ícono */}
        <div className="w-20 h-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-3xl flex flex-col items-center justify-center relative z-10 gap-2">
          <Spinner size="lg" color="primary" />
        </div>

        {/* Pequeño ícono de agua flotante (Opcional, le da identidad al sistema) */}
        <div className="absolute -top-2 -right-2 bg-white dark:bg-zinc-800 p-1.5 rounded-full border border-slate-100 dark:border-zinc-700 shadow-sm z-20">
            <IoWaterOutline className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* Textos de estado */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
          {titulo}
        </h1>
        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest animate-pulse">
          {mensaje}
        </p>
      </div>

    </div>
  );
};

export default LoadingVistas;