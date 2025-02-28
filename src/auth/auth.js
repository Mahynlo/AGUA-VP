const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db/Cliente");

const SECRET_KEY = "mi_secreto_super_seguro"; // Cambia esto en producción

// 📌 Función para registrar usuarios
const registerUser = async (correo, contraseña, username, rol) => {
  const hashedPassword = await bcrypt.hash(contraseña, 10);

  try {
    await db.execute({
      sql: "INSERT INTO usuarios (correo, contraseña, username, rol) VALUES (?, ?, ?, ?)",
      args: [correo, hashedPassword, username, rol],
    });

    return { success: true, message: "Usuario registrado con éxito" };
  } catch (error) {
    return { success: false, message: "El usuario ya existe o hubo un error" };
  }
};

// 📌 Función para autenticar usuarios
const loginUser = async (correo, contraseña) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM usuarios WHERE correo = ?",
      args: [correo],
    });

    if (result.rows.length === 0) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (!isMatch) return { success: false, message: "Contraseña incorrecta" };

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, correo: user.correo, rol: user.rol },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return { success: true, token, username: user.username, rol: user.rol };
  } catch (error) {
    return { success: false, message: "Error en la autenticación" };
  }
};

// 📌 Función para verificar token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};






