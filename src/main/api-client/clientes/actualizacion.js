import { leerToken } from '../appConfig/authApp';
import { apiFetch } from '../main/api-client/http.js';
const URL_CLIENTES_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_CLIENTE; // URL del endpoint de clientes
const URL_TARIFA_CLIENTE = import.meta.env.VITE_API_ACTUALIZAR_TARIFA_CLINTE; // URL del endpoint de asignar tarifa a cliente

/**************************************************************************************************************
 * Función para Asignar/Cambiar Tarifa de un Cliente
 *************************************************************************************************************/
const asignarTarifaCliente = async (clienteId, tarifaId, token_session) => {
  try {
    const token_app = leerToken(); // Token app

    const response = await apiFetch(`${URL_TARIFA_CLIENTE}/${clienteId}/asignar-tarifa`, {
      method: "PUT",
      token_app,
      token_session,
      body: { tarifa_id: tarifaId }
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

    const response = await apiFetch(`${URL_CLIENTES_ACTUALIZAR}/${id}`, {
      method: "PUT",
      token_app,
      token_session,
      body: nuevosDatos
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.error || "Error al modificar cliente";
      if (data.detalles && Array.isArray(data.detalles)) {
        const detallesMsg = data.detalles.map(d => d.mensaje).join(" | ");
        errorMessage = `${errorMessage}: ${detallesMsg}`;
      }
      return { success: false, message: errorMessage };
    }

    return { success: true, message: "Cliente modificado correctamente", cambios: data.cambios };
  } catch (error) {
    console.error("Error en updateCliente:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const deleteCliente = async (data, token_session) => {
  const { id, razon } = data;
  try {
    const token_app = leerToken();
    const baseURL = URL_CLIENTES_ACTUALIZAR.replace('/modificar', '');
    const response = await apiFetch(`${baseURL}/${id}/eliminar`, {
      method: "DELETE",
      token_app,
      token_session,
      body: { razon }
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.error || "Error al eliminar cliente" };
    }
    return { success: true, message: "Cliente eliminado correctamente", cliente_id: payload.cliente_id };
  } catch (error) {
    console.error("Error en deleteCliente:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const reactivateCliente = async (id, token_session) => {
  try {
    const token_app = leerToken();
    const baseURL = URL_CLIENTES_ACTUALIZAR.replace('/modificar', '');
    const response = await apiFetch(`${baseURL}/${id}/restaurar`, {
      method: "PUT",
      token_app,
      token_session
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.error || "Error al restaurar cliente" };
    }
    return { success: true, message: "Cliente restaurado correctamente", cliente_id: payload.cliente_id };
  } catch (error) {
    console.error("Error en reactivateCliente:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const purgeCliente = async (id, token_session) => {
  try {
    const token_app = leerToken();
    const baseURL = URL_CLIENTES_ACTUALIZAR.replace('/modificar', '');
    const response = await apiFetch(`${baseURL}/${id}/purgar`, {
      method: "DELETE",
      token_app,
      token_session
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.error || "Error al eliminar definitivamente" };
    }
    return { success: true, message: "Cliente eliminado definitivamente" };
  } catch (error) {
    console.error("Error en purgeCliente:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

export { updateCliente, asignarTarifaCliente, deleteCliente, reactivateCliente, purgeCliente };
