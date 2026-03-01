/**
 * Hook para manejar el formulario de cliente (crear/editar)
 * Elimina la duplicación entre RegistrarCliente y EditarCliente
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClientes } from "../context/ClientesContext";
import { useMedidores } from "../context/MedidoresContext";
import { useFeedback } from "../context/FeedbackContext";
import { validarCamposCliente, obtenerCamposFaltantes, limpiarDatosCliente } from "../utils/clienteValidation";

export const useClienteForm = (clienteId = null) => {
  const { user } = useAuth();
  const { clientes, actualizarClientes } = useClientes();
  const { actualizarMedidores } = useMedidores(); // 🔹 Hook added
  const { setSuccess, setError } = useFeedback();

  // Estados del formulario
  const [formData, setFormData] = useState({
    numero_predio: "",
    nombre: "",
    direccion: "",
    telefono: "",
    ciudad: "",
    correo: "",
    tarifaSeleccionada: "",
    estadoCliente: "Activo",
    medidorAsignado: null,
    medidoresLiberados: new Set()
  });

  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fechaRegistroCliente, setFechaRegistroCliente] = useState("");

  // Modo: 'crear' o 'editar'
  const modo = clienteId ? 'editar' : 'crear';

  // Obtener datos del cliente si es edición
const cliente = clienteId 
  ? clientes.find(c => c.id?.toString() === clienteId.toString()) 
  : null;

  // Cargar datos del cliente al abrir en modo edición
  useEffect(() => {
    if (clienteId && cliente) {
      setFormData({
        numero_predio: cliente.numero_predio || "",
        nombre: cliente.nombre || "",
        direccion: cliente.direccion || "",
        telefono: cliente.telefono || "",
        ciudad: cliente.ciudad || "",
        correo: cliente.correo || "",
        tarifaSeleccionada: cliente.id_tarifa ? String(cliente.id_tarifa) : "",
        estadoCliente: cliente.estado_cliente || "Activo",
        medidorAsignado: cliente.id_medidor || null,
        medidoresLiberados: new Set()
      });
      setFechaRegistroCliente(cliente.fecha_creacion || "");
    }
  }, [clienteId, cliente]);

  // Handler para cambios en los campos
  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    limpiarError(campo);
  };

  // Limpiar error de un campo específico
  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[campo];
        return nuevosErrores;
      });
    }
  };

  // Resetear el formulario
  const resetForm = () => {
    setFormData({
      numero_predio: "",
      nombre: "",
      direccion: "",
      telefono: "",
      ciudad: "",
      correo: "",
      tarifaSeleccionada: "",
      estadoCliente: "Activo",
      medidorAsignado: null,
      medidoresLiberados: new Set()
    });
    setErroresCampos({});
    setMostrarErrores(false);
    setIsUpdating(false);
    setFechaRegistroCliente("");
  };

  // Manejar liberación de medidores (solo en edición)
  const handleLiberarMedidores = (idsActuales) => {
    const nuevoSet = new Set(idsActuales);
    setFormData(prev => ({ ...prev, medidoresLiberados: nuevoSet }));
  };

  // Manejar selección de medidor
  const handleMedidorSeleccionado = (medidorId) => {
    setFormData(prev => ({ ...prev, medidorAsignado: medidorId }));
  };

  // Validar y enviar formulario
  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setIsUpdating(true);
    setMostrarErrores(true);

    // Validar campos
    const nuevosErrores = validarCamposCliente(formData, {
      esEdicion: modo === 'editar',
      tieneTarifaAsignada: cliente?.tarifa_id ? true : false
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      const camposFaltantes = obtenerCamposFaltantes(nuevosErrores);
      setError(
        `Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`,
        modo === 'crear' ? "Registro de Clientes" : "Actualización de Cliente"
      );
      setIsUpdating(false);
      return { success: false };
    }

    setErroresCampos({});

    try {
      const tokensession = localStorage.getItem("token");
      let response;

      if (modo === 'crear') {
        // Crear nuevo cliente
        const datosLimpios = limpiarDatosCliente(formData);
        response = await window.api.registerClient({
          cliente: {
            ...datosLimpios,
            modificado_por: user.id
          },
          token_session: tokensession
        });
      } else {
        // Actualizar cliente existente
        const nuevosDatos = {
          numero_predio: formData.numero_predio?.trim().toUpperCase() || null,
          nombre: formData.nombre,
          direccion: formData.direccion,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
          correo: formData.correo,
          estado_cliente: formData.estadoCliente,
          modificado_por: user.id,
          medidor_id: formData.medidorAsignado ?? null,
          medidores_liberados: Array.from(formData.medidoresLiberados)
        };

        response = await window.api.updateClient({
          id: clienteId,
          nuevosDatos,
          token_session: tokensession
        });
      }

      if (response.success) {
        // Solo asignar tarifa si es EDICIÓN y la tarifa cambió
        // En modo crear, el servidor ya asigna la tarifa automáticamente
        if (modo === 'editar' && formData.tarifaSeleccionada && String(cliente.id_tarifa) !== formData.tarifaSeleccionada) {
          console.log('🔧 Asignando tarifa', formData.tarifaSeleccionada, 'al cliente', clienteId);
          
          const tarifaResponse = await window.api.asignarTarifaCliente({
            clienteId: clienteId,
            tarifaId: parseInt(formData.tarifaSeleccionada),
            token_session: tokensession
          });

          if (!tarifaResponse.success) {
            setError(
              `Cliente actualizado, pero hubo un error al asignar la tarifa: ${tarifaResponse.message}`,
              "Actualización de Cliente"
            );
            setIsUpdating(false);
            return { success: false };
          }
        }

        setSuccess(
          modo === 'crear' ? "Cliente registrado exitosamente." : "Cliente actualizado correctamente.",
          modo === 'crear' ? "Registro de Clientes" : "Actualización de Cliente"
        );

        // 🔹 Force immediate refresh of both contexts
        await Promise.all([
          actualizarMedidores(), // Vital for "BuscarMedidor" to show correct status
          actualizarClientes()   // Vital for Client List to show correct assigned meter
        ]);

        setTimeout(() => {
          setIsUpdating(false);
        }, 1500);

        return { success: true };
      } else {
        setError(
          response.message,
          modo === 'crear' ? "Registro de Clientes" : "Actualización de Cliente"
        );
        setIsUpdating(false);
        return { success: false };
      }
    } catch (err) {
      console.error("Error en formulario cliente:", err);
      setError(
        "Ocurrió un error. Intenta nuevamente.",
        modo === 'crear' ? "Registro de Clientes" : "Actualización de Cliente"
      );
      setIsUpdating(false);
      return { success: false };
    }
  };

  return {
    // Estado
    formData,
    erroresCampos,
    mostrarErrores,
    isUpdating,
    fechaRegistroCliente,
    modo,
    cliente,

    // Handlers
    handleChange,
    handleSubmit,
    limpiarError,
    resetForm,
    handleLiberarMedidores,
    handleMedidorSeleccionado,

    // Utilidades
    setFormData,
    setErroresCampos,
    setMostrarErrores
  };
};
