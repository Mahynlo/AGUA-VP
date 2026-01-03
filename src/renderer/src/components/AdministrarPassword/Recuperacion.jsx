
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import ModalRegistrarUsuario from "../administrador/ModalRegistroUsuario";

export default function RecuperarPassword() {
  const [reciboData, setReciboData] = useState({
    nombre: 'Juan Pérez',
    monto: 100,
    fecha: '2025-05-11',
  });

  const handleVistaPreviaReporte = async () => {
    const response = await window.api.previewRecibohtml(reciboData);
    console.log('Respuesta del Main Process:', response);  // Puedes hacer algo con la respuesta si es necesario
  };

  const [respuesta, setRespuesta] = useState(null);


  const handleRegistrar = async () => {
    const res = await window.authApp.registrarApp("Mi App desde React");
    setRespuesta(res);
  };

  //verificar si el token existe
  const [token, setToken] = useState(null);

  useEffect(() => {
    const verificarToken = async () => {
      const res = await window.authApp.leerToken();
      if (res && res.token) {
        setToken(res.token);
      }
    };

    verificarToken();
  }, []);

  const handleBorrarToken = async () => {
    await window.authApp.borrarToken();
    localStorage.removeItem("appRegistrada"); // <- Elimina la marca de app registrada
    console.log("Token y appRegistrada eliminados");
  };

  //leer id 
  const [id, setId] = useState(null);

  //token de session 
  const tokensession = localStorage.getItem("token");

  useEffect(() => {
    const verificarId = async () => {
      const res = await window.authApp.leerId();
      if (res && res.id) {
        setId(res.id);
      }
    };
    verificarId();
  }
    , []);
  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <h1>Recuperar Password</h1>
      <div className="text-right mt-2">
        <Link to="/" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-700">
          Regresar
        </Link>

      </div>

      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          Ayuda
        </div>

        <Link to="/pantallaCarga">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Pantalla de Carga
          </button>
        </Link>

        <button
          onClick={handleVistaPreviaReporte}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Vista Previa de Reporte
        </button>

        <div>
          <button onClick={handleRegistrar}>Registrar App</button>
          {respuesta && (
            <pre>{JSON.stringify(respuesta, null, 2)}</pre>
          )}
        </div>
        <div className="mt-4">
          <button onClick={handleBorrarToken}>Borrar Token</button>
          {token && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <strong>Token guardado:</strong> {token}
            </div>

          )}
          {id && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <strong>ID guardado:</strong> {id}
            </div>
          )}

          {
            tokensession && (
              <div className="mt-4 p-2 bg-gray-100 rounded">
                <strong>Token de sesión:</strong> {tokensession}
              </div>
            )

          }
        </div>

        <ModalRegistrarUsuario />



      </div>


    </div>
  )
}