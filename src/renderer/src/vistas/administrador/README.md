# Panel de Administración - AguaVP

Vista montada en la ruta `/administrador` (`AdministradorVista.jsx`). Organiza el panel en pestañas; la pestaña activa se recuerda en `localStorage` (`admin_activeTab`).

## Pestañas

| Pestaña | Componente (en `components/`) | Visible para operador |
|---|---|---|
| Usuarios y Permisos | `GestionUsuarios.jsx` (+ `ModalRegistroUsuario`, `ModalPermisosUsuario`, `ModalSesionesUsuario`) | No |
| Mantenimiento | `sistema/ConsolaSistema.jsx` | Sí |
| Configuración Global | `PanelConfiguracion.jsx` | No |
| Personalización Visual | `PanelPersonalizacion.jsx` | Sí |

### Consola del sistema (`components/sistema/`)

`ConsolaSistema.jsx` agrupa los paneles de mantenimiento, envueltos en `ErrorBoundary.jsx`:

- `PanelInfoSistema.jsx` — estado del servidor API embebido y del equipo.
- `PanelLogs.jsx` — visor de logs (`window.api.system.getLogs`, `onLogEntry`).
- `PanelBackups.jsx` — creación, listado y restauración de respaldos de la BD.
- `PanelBaseDatos.jsx` — información de la BD y migraciones aplicadas.
- `PanelSincronizacionNube.jsx` — configuración y sincronización con Turso (ver `docs/sincronizacion-turso-cloud.md`).
- `PanelActualizaciones.jsx` — búsqueda, descarga e instalación de actualizaciones. Está en `src/renderer/src/components/actualizaciones/` porque también lo usa la vista `/actualizaciones`.

`ModalActualizacionDisponible.jsx` (también en `components/actualizaciones/`) se monta globalmente en `App.jsx`, no dentro de esta vista.

### Sin uso actualmente

`DashboardAdmin.jsx`, `GestionClientes.jsx` y `GestionMedidores.jsx` no se montan en ninguna pestaña.

## Roles

La vista lee `useAuth()` (`user.rol`). El rol `operador` solo ve Mantenimiento y Personalización.

## Iconos

`src/renderer/src/IconsApp/IconsAdmin.jsx` (`UsuariosAdminIcon`, `MantenimientoIcon`, `ConfiguracionAdminIcon`, …).
