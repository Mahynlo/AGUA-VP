import { leerToken } from '../../auth/appKey.js';
import { apiFetch } from '../http.js';
const URL_REGISTRAR_CLIENTE = import.meta.env.VITE_API_REGISTRAR_CLIENTE; // URL del endpoint de registro de clientes
/**************************************************************************************************************
 * Funcion de Registro de clientes
 * ************************************************************************************************************
 */
// 📌 Función para registrar clientes con validación y campo 'modificado_por'
const registerClientes = async (cliente, token_session) => {
  try {
    const token_app = leerToken();

    if (!token_app) {
      console.error("Token app no disponible");
      return { success: false, message: "Token de aplicación no disponible" };
    }

    if (!token_session) {
      console.error("Token de sesión no disponible");
      return { success: false, message: "Token de sesión no disponible" };
    }

    // cliente debe ser un objeto con los campos necesarios
    const response = await apiFetch(URL_REGISTRAR_CLIENTE, {
      method: "POST",
      token_app,
      token_session,
      body: cliente
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.error || "Error al registrar cliente";
      if (data.detalles && Array.isArray(data.detalles)) {
        const detallesMsg = data.detalles.map(d => d.mensaje).join(" | ");
        errorMessage = `${errorMessage}: ${detallesMsg}`;
      }
      return { success: false, message: errorMessage };
    }

    return { success: true, message: data.mensaje, clienteID: data.clienteID };
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return { success: false, message: "Hubo un error al registrar el cliente" };
  }
};


export { registerClientes };
