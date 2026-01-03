

import { ipcMain} from 'electron';


import { loginUser,verifyToken,cerrarSesion,obtenerSesionesActivas,renovarToken,cerrarSesionEspecifica} from '../../auth/auth.js'; // Importa la función loginUser
import { registerUser } from '../../register/usuario.js'; // Importa la función registerUser

export default function IpcHandlerUsuario () {
    // 📌 Manejar autenticación login
    ipcMain.handle("login", async (event, data) => {
        return await loginUser(data.correo, data.contrasena);
    });
    
    // 📌 Manejar autenticación registro
    ipcMain.handle("register", async (event, data) => {
        return await registerUser(data.correo,data.nombre, data.contrasena, data.username, data.rol);
    });
    
    
    
    // 📌 cerrar session 
    ipcMain.handle("logout", async (event, token) => {
        console.log("🔄 IPC Handler logout recibido para token:", token);
        const result = await cerrarSesion(token);
        console.log("📤 IPC Handler logout resultado:", result);
        return result;
    });


    // 📌 Manejar verificación de sesión
        ipcMain.handle("verify-session", async (event, token) => {
      const verified = verifyToken(token);
      return verified ? { success: true, user: verified } : { success: false };
    });
    
        
    // 📌 Sessiones activas de usuario
    ipcMain.handle("active-sessions-user", async (event,usuario_id ) => {
        return obtenerSesionesActivas(usuario_id);
    });

    // 📌 Renovar access token
    ipcMain.handle("refresh-token", async (event, refreshToken) => {
        console.log("🔄 IPC Handler refresh-token recibido");
        const result = await renovarToken(refreshToken);
        console.log("📤 IPC Handler refresh-token resultado:", result);
        return result;
    });

    // 📌 Cerrar sesión específica por ID
    ipcMain.handle("close-specific-session", async (event, sesionId, token) => {
        console.log("🔄 IPC Handler close-specific-session recibido para sesión:", sesionId);
        const result = await cerrarSesionEspecifica(sesionId, token);
        console.log("📤 IPC Handler close-specific-session resultado:", result);
        return result;
    });

}