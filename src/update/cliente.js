import { leerToken } from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_CLIENTES_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_CLIENTE; // URL del endpoint de clientes
/**************************************************************************************************************
 * Función para Actualizar Cliente (incluye actualización de medidores si aplica)
 *************************************************************************************************************/
const updateCliente = async (id,nuevosDatos, token_session) => {
  
 try {
    const token_app = leerToken(); // Token app

    const response = await fetch(`${URL_CLIENTES_ACTUALIZAR}/${id}`, {
      method: "PUT",
      headers: {
        
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nuevosDatos),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al modificar cliente" };
    }

    return { success: true, message: "Cliente modificado correctamente", cambios: data.cambios };
  } catch (error) {
    console.error("Error en updateCliente:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

export { updateCliente };
