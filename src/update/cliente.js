import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite

/**************************************************************************************************************
 * Funcion para Actualizaciones de cleinte
 * ************************************************************************************************************
 */
// 📌 Función para actualizar clientes y registrar los cambios en el Historial 
const updateCliente = async (id, nuevosDatos, datosAnteriores, modificado_por) => {
  try {
    // 📌 Comparar los valores anteriores con los nuevos
    const cambios = [];
    if (datosAnteriores.nombre !== nuevosDatos.nombre) cambios.push(`Nombre: ${datosAnteriores.nombre} → ${nuevosDatos.nombre}`);
    if (datosAnteriores.direccion !== nuevosDatos.direccion) cambios.push(`Dirección: ${datosAnteriores.direccion} → ${nuevosDatos.direccion}`);
    if (datosAnteriores.telefono !== nuevosDatos.telefono) cambios.push(`Teléfono: ${datosAnteriores.telefono} → ${nuevosDatos.telefono}`);
    if (datosAnteriores.ciudad !== nuevosDatos.ciudad) cambios.push(`Ciudad: ${datosAnteriores.ciudad} → ${nuevosDatos.ciudad}`);
    if (datosAnteriores.correo !== nuevosDatos.correo) cambios.push(`Correo: ${datosAnteriores.correo} → ${nuevosDatos.correo}`);
    if (datosAnteriores.estado_cliente !== nuevosDatos.estado_cliente) cambios.push(`Estado: ${datosAnteriores.estado_cliente} → ${nuevosDatos.estado_cliente}`);

    if (cambios.length === 0) {
      return { success: false, message: "No se realizaron cambios" };
    }

    // 📌 Actualizar el cliente en la base de datos
    await db.execute({
      sql: "UPDATE clientes SET nombre = ?, direccion = ?, telefono = ?, ciudad = ?, correo = ?, estado_cliente = ?, modificado_por = ? WHERE id = ?",
      args: [nuevosDatos.nombre, nuevosDatos.direccion, nuevosDatos.telefono, nuevosDatos.ciudad, nuevosDatos.correo, nuevosDatos.estado_cliente, modificado_por, id],
    });

    // 📌 Insertar el historial de cambios
    await db.execute({
      sql: "INSERT INTO historial_cambios (tabla, operacion, registro_id, modificado_por, cambios) VALUES ('clientes', 'UPDATE', ?, ?, ?)",
      args: [id, modificado_por, cambios.join(", ")],
    });

    return { success: true, message: "Cliente actualizado y cambios registrados" };
  } catch (error) {
    return { success: false, message: "Error al actualizar el cliente" };
  }
};

export { updateCliente };