# Vista de Pagos - Documentación

## Descripción General
La vista de pagos es un módulo completo para la gestión de facturas, pagos e historial dentro del sistema AguaVP.

## Componentes Actualizados Recientemente

### ModalDetallePago.jsx (Nuevo)
- **Componente Independiente**: Modal extraído del componente principal
- **UI Modernizada**: Diseño con gradientes, iconos y mejor organización visual
- **Información Completa**: Muestra todos los detalles del pago de forma organizada
- **Manejo de Pagos Múltiples**: Visualización especial para facturas con múltiples pagos
- **Responsive**: Diseño que se adapta a diferentes pantallas

### TabPagos.jsx (Modernizado)
- **UI Actualizada**: Cambio de tabla tradicional a cards con diseño moderno
- **Consistencia Visual**: Diseño similar a TabFacturas para mantener coherencia
- **Componentes Separados**: Modales extraídos como componentes independientes
- **Mejor UX**: Interfaz más visual con gradientes, shadows y mejor organización
- **Paginación Mejorada**: Controles más intuitivos y visualmente atractivos

## Estructura de Componentes

### PagosVista.jsx (Componente Principal)
- Contenedor principal con estructura de tabs
- Utiliza NextUI Tabs para navegación entre secciones
- Tres pestañas principales: Facturas, Pagos y Estadísticas

### TabFacturas.jsx
**Funcionalidades:**
- Lista de facturas por cliente agrupadas por estado
- Filtros por estado (Pendiente, Pagado, Vencida)
- Información detallada de cada factura:
  - Fecha de emisión
  - Consumo en m³
  - Total a pagar
  - Saldo pendiente
  - Estado actual
- Modal de detalle de factura
- Modal de pago con formulario de:
  - Monto a pagar (con validación)
  - Método de pago (select)
  - Observaciones opcionales
- Validaciones:
  - El monto no debe exceder el saldo pendiente
  - Método de pago obligatorio
  - Monto mayor a 0

### TabPagos.jsx (Modernizado - Versión Final)
**Funcionalidades:**
- Historial completo de pagos realizados con tabla estilizada
- **UI Idéntica a TabFacturas**: Mismo estilo, estructura y componentes
- **Soporte Completo de Modo Oscuro**: Adaptación automática para temas claros y oscuros
- **Organización de Información Mejorada**:
  - **ID PAGO**: Identificador único del pago
  - **NÚMERO**: Indicador de pago (ej: 1/1, 2/3) con notación de múltiples
  - **CLIENTE**: Nombre y número de medidor
  - **FECHA**: Fecha del pago con formato local
  - **FACTURA**: ID de factura relacionada con total de pagos múltiples
  - **ESTADO**: Estado actual de la factura (Pagado/Pendiente)
  - **MONTO**: Cantidad pagada
  - **ENTREGADO**: Cantidad entregada por el cliente
  - **CAMBIO**: Cambio devuelto (con indicador visual)
  - **MÉTODO**: Método de pago con chips coloridos
  - **ACCIONES**: Botón para ver detalles
- Filtros por:
  - Cliente (búsqueda por nombre, ID, factura, medidor)
  - Método de pago
  - Período de tiempo
- Métricas rápidas:
  - Total de pagos registrados
  - Monto total recaudado
  - Promedio por pago
- **Paginación Consistente**: Mismo estilo y color que TabFacturas
- Modal de detalle modernizado (componente separado)
- **Estructura Limpia**: Cards separados para filtros y tabla como TabFacturas

### TabEstadisticas.jsx
**Funcionalidades:**
- Métricas y análisis financiero
- Selector de periodo (mes, trimestre, año)
- Indicadores principales:
  - Total recaudado vs facturado
  - Porcentaje de cobranza
  - Pagos pendientes
- Distribución por:
  - Estado de facturas
  - Métodos de pago
- Información adicional:
  - Promedio de consumo
  - Eficiencia de cobranza
  - Recaudo promedio por cliente
- Evolución mensual (para período actual)

## Iconos Utilizados
- **PagosIcon**: Icono principal para pagos
- **FacturasIcon**: Icono para facturas (agregado)
- **EstadisticasPagosIcon**: Icono para estadísticas (agregado)
- **FlechaReturnIcon**: Botón de retorno

## Estados de Facturas
1. **Pendiente** (Warning) - Factura emitida sin pagar
2. **Pagado** (Success) - Factura completamente pagada
3. **Vencida** (Danger) - Factura con fecha de vencimiento pasada

## Métodos de Pago Soportados
- Efectivo
- Transferencia Bancaria
- Tarjeta de Crédito/Débito
- Cheque

## Validaciones Implementadas
- Monto de pago no debe exceder saldo pendiente
- Método de pago obligatorio
- Validación de campos numéricos
- Formateo de moneda en pesos mexicanos

## Datos de Ejemplo
Todos los componentes incluyen datos de ejemplo para demostración. En producción, estos datos deberían venir de:
- Contextos de React (ClientesContext, etc.)
- APIs del backend
- Base de datos local

## Dependencias
- @nextui-org/react (Tabs, Cards, Tables, Modals, etc.)
- flowbite-react (Buttons)
- react-router-dom (Navigation)

## Próximas Mejoras
- Integración con impresora para recibos
- Exportación de reportes a PDF/Excel
- Gráficos interactivos para estadísticas
- Notificaciones automáticas por vencimiento
- Integración con pasarelas de pago
