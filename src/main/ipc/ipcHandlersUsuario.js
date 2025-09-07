

import { ipcMain} from 'electron';


import { loginUser,verifyToken,cerrarSesion,obtenerSesionesActivas} from '../../auth/auth.js'; // Importa la función loginUser
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

}