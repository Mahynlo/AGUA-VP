// src/components/PantallaCarga.jsx
import React, { useEffect, useState } from "react";
import logo from "../../assets/images/logo_login.png"; // Asegúrate de que la ruta sea correcta
import NavbarApp from '../menuElements/navbar';
const PantallaCarga = ({ tiempo = 5000, onFinalizado }) => {
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
    <>
      <NavbarApp /> {/* Mostrar la barra de navegación en la pantalla de carga */}
      <div style={estilos.fondo} className="bg-gradient-to-r from-blue-500 to-blue-300">
      <div style={estilos.caja} >
        <img src={logo} alt="Logo" className="w-32 h-32 mb-4" />
        <h1 className="text-[30px] text-gray-700 font-bold">AGUA-VP</h1>
        <div style={estilos.spinner}></div>
      </div>
    </div>
    </>
    
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
    width: 30,
    height: 30,
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

export default PantallaCarga;
