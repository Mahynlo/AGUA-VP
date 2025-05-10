import { db } from '../db/Cliente.js';

/**************************************************************************************************************
 * Función para Actualizar Cliente (incluye actualización de medidores si aplica)
 *************************************************************************************************************/
const updateCliente = async (id, nuevosDatos, datosAnteriores, modificado_por, medidor_id) => {
  try {
    const cambios = [];

    // Comparar campos del cliente
    if (datosAnteriores.nombre !== nuevosDatos.nombre) cambios.push(`Nombre: ${datosAnteriores.nombre} → ${nuevosDatos.nombre}`);
    if (datosAnteriores.direccion !== nuevosDatos.direccion) cambios.push(`Dirección: ${datosAnteriores.direccion} → ${nuevosDatos.direccion}`);
    if (datosAnteriores.telefono !== nuevosDatos.telefono) cambios.push(`Teléfono: ${datosAnteriores.telefono} → ${nuevosDatos.telefono}`);
    if (datosAnteriores.ciudad !== nuevosDatos.ciudad) cambios.push(`Ciudad: ${datosAnteriores.ciudad} → ${nuevosDatos.ciudad}`);
    if (datosAnteriores.correo !== nuevosDatos.correo) cambios.push(`Correo: ${datosAnteriores.correo} → ${nuevosDatos.correo}`);
    if (datosAnteriores.estado_cliente !== nuevosDatos.estado_cliente) cambios.push(`Estado: ${datosAnteriores.estado_cliente} → ${nuevosDatos.estado_cliente}`);

    // Actualización de medidores (si se proporcionan)
    if (medidor_id) {
      const medidores = Array.isArray(medidor_id) ? medidor_id : [medidor_id];

      const medidoresAsignados = [];

      for (const mid of medidores) {
        const result = await db.execute({
          sql: "SELECT cliente_id FROM medidores WHERE id = ?",
          args: [mid],
        });

        const medidor = result.rows?.[0];
        if (!medidor) {
          return { success: false, message: `Medidor con ID ${mid} no existe` };
        }

        // Verificar si ya está asignado a otro cliente
        if (medidor.cliente_id && medidor.cliente_id !== id) {
          return {
            success: false,
            message: `El medidor con ID ${mid} ya está asignado a otro cliente (ID ${medidor.cliente_id})`,
          };
        }

        // Asociar el medidor al cliente
        await db.execute({
          sql: "UPDATE medidores SET cliente_id = ? WHERE id = ?",
          args: [id, mid],
        });

        medidoresAsignados.push(mid);
      }

      if (medidoresAsignados.length > 0) {
        cambios.push(`Medidor(es) asignado(s): ${medidoresAsignados.join(", ")}`);
      }
    }

    if (cambios.length === 0) {
      return { success: false, message: "No se realizaron cambios" };
    }

    // Actualizar el cliente
    await db.execute({
      sql: "UPDATE clientes SET nombre = ?, direccion = ?, telefono = ?, ciudad = ?, correo = ?, estado_cliente = ?, modificado_por = ? WHERE id = ?",
      args: [
        nuevosDatos.nombre,
        nuevosDatos.direccion,
        nuevosDatos.telefono,
        nuevosDatos.ciudad,
        nuevosDatos.correo,
        nuevosDatos.estado_cliente,
        modificado_por,
        id,
      ],
    });

    // Insertar en historial
    await db.execute({
      sql: "INSERT INTO historial_cambios (tabla, operacion, registro_id, modificado_por, cambios) VALUES ('clientes', 'UPDATE', ?, ?, ?)",
      args: [id, modificado_por, cambios.join(", ")],
    });

    return { success: true, message: "Cliente actualizado y cambios registrados" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error al actualizar el cliente" };
  }
};

export { updateCliente };
