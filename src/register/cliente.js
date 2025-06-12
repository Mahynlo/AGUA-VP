import { leerToken } from '../appConfig/authApp';
const URL_REGISTRAR_CLIENTE = import.meta.env.VITE_API_REGISTRAR_CLIENTE; // URL del endpoint de registro de clientes
/**************************************************************************************************************
 * Funcion de Registro de clientes
 * ************************************************************************************************************
 */
// 📌 Función para registrar clientes con validación y campo 'modificado_por'
const registerClientes = async (cliente, token_session) => {
  try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente
    //console.log("Token de la app:", token_app); // Para depuración, puedes eliminarlo después
    //console.log("Token de sesión:", token_session); // Para depuración, puedes eliminarlo después
    //console.log("Datos del cliente:", cliente); // Para depuración, puedes eliminarlo después
    
    if (!token_app) {
      console.error("Token app no disponible");
      return { success: false, message: "Token de aplicación no disponible" };
    }

    if (!token_session) {
      console.error("Token de sesión no disponible");
      return { success: false, message: "Token de sesión no disponible" };
    }

    const response = await fetch(URL_REGISTRAR_CLIENTE, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cliente) // cliente debe ser un objeto con los campos necesarios
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al registrar cliente" };
    }

    return { success: true, message: data.mensaje, clienteID: data.clienteID };
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return { success: false, message: "Hubo un error al registrar el cliente" };
  }
};


export { registerClientes };