import { leerToken } from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_CLIENTES_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_CLIENTE; // URL del endpoint de clientes
const URL_TARIFA_CLIENTE = import.meta.env.VITE_API_ACTUALIZAR_TARIFA_CLINTE; // URL del endpoint de asignar tarifa a cliente

/**************************************************************************************************************
 * Función para Asignar/Cambiar Tarifa de un Cliente
 *************************************************************************************************************/
const asignarTarifaCliente = async (clienteId, tarifaId, token_session) => {
  try {
    const token_app = leerToken(); // Token app

    const response = await fetch(`${URL_TARIFA_CLIENTE}/${clienteId}/asignar-tarifa`, {
      method: "PUT",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tarifa_id: tarifaId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error HTTP ${response.status}:`, errorText);
      return { success: false, message: `Error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, message: data.mensaje || "Tarifa asignada correctamente" };
  } catch (error) {
    console.error("Error en asignarTarifaCliente:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

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

export { updateCliente, asignarTarifaCliente };
