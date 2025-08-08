# Vista de Pagos - Documentación

## Descripción General
La vista de pagos es un módulo completo para la gestión de facturas, pagos e historial dentro del sistema AguaVP.

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

### TabPagos.jsx
**Funcionalidades:**
- Historial completo de pagos realizados
- Filtros por:
  - Cliente (búsqueda por nombre)
  - Método de pago
- Métricas rápidas:
  - Total de pagos registrados
  - Monto total recaudado
  - Promedio por pago
  - Clientes únicos
- Información de cada pago:
  - Número de recibo
  - Fecha y cliente
  - Factura relacionada
  - Monto y método de pago
  - Observaciones
- Función de impresión de recibos

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
