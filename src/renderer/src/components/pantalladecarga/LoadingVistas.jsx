// src/components/PantallaCarga.jsx
import React, { useEffect, useState } from "react";

const LoadingVistas= ({ tiempo = 5000, onFinalizado }) => {
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
    <div style={estilos.fondo} className="dark:bg-gray-900 bg-gray-100">
      <div style={estilos.caja} >
        
        <h1 className="text-[18px] text-gray-700 dark:text-gray-100 font-bold">Cargando ...</h1>
        <div style={estilos.spinner}></div>
      </div>
    </div>
  );
};

const estilos = {
  fondo: {
    height: "100vh",
    margin: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

  },
  caja: {
    width: 400,
    height: 300,
    
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    flexDirection: "column",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: 50,
    height: 50,
    animation: "spin 1s linear infinite",
    marginTop: 10,
  },
};

// Agrega animación globalmente (puede ir en CSS si prefieres)
const styleSheet = document.styleSheets[0];
const keyframes =
  `@keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
   }`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default LoadingVistas;