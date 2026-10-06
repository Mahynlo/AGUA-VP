# Módulo: Administración

## ¿Qué es?

El módulo de Administración cubre las funciones de soporte del sistema: gestión de los usuarios que operan la aplicación, control de permisos, respaldos de la base de datos y acceso a los registros de actividad. Es el área destinada al administrador del sistema.

---

## ¿Qué se puede hacer aquí?

### Usuarios del sistema

Estos son las personas que usan la aplicación (cajeros, lectores, administradores), distintos de los clientes del servicio de agua.

- **Crear usuarios** con nombre, contraseña y rol
- **Editar** información de un usuario
- **Desactivar o reactivar** usuarios (sin borrar su historial)
- **Ver el perfil** del usuario actual

### Permisos

Cada usuario puede tener acceso a ciertas funciones y no a otras. El administrador puede:

- **Ver el catálogo de permisos** disponibles en el sistema
- **Asignar o quitar permisos** a cada usuario
- De esta forma, un cajero puede registrar pagos pero no puede modificar tarifas o crear usuarios

### Respaldos (Backups)

La base de datos local puede respaldarse para evitar pérdida de información.

- **Crear un respaldo** manual de la base de datos en cualquier momento
- **Ver el listado** de respaldos existentes (con fecha y tamaño)
- **Restaurar** un respaldo anterior si ocurre algún problema

### Registros de actividad (Logs)

El sistema guarda un historial de lo que ocurre en la aplicación:

- **Ver los logs** de actividad reciente
- **Ver estadísticas** de los registros (cantidad de errores, advertencias, etc.)
- **Limpiar los logs** cuando ya no son necesarios

### Información del sistema

- Versión actual de la aplicación
- Estado del servidor interno
- Información de la base de datos (tamaño, número de registros)

### Sincronización en la Nube (Turso Cloud)

Permite mantener una réplica viva de la base de datos en la nube sin depender de copias manuales físicas:

- **Configuración segura**: Ingreso de URL y Token de Turso cifrados mediante `safeStorage` (DPAPI de Windows), sin almacenar credenciales en archivos planos.
- **Carga semilla inicial**: Respaldo completo de todas las tablas, catálogos, lecturas y facturas históricas hacia Turso.
- **Sincronización incremental automática**: Envío periódico (cada 15 minutos) de cobros y lecturas en segundo plano.
- **Consumo Zero-Waste**: Análisis local previo para no consumir ancho de banda si no hay cambios, cuidando la cuota mensual de 3 GB de Turso.
- **Consistencia y recuperación**: Si se cambia de equipo, la base de datos descargada de Turso restaura automáticamente todos los disparadores de cobro y validación al iniciar la aplicación.

---

## Roles de usuario

| Rol | Nivel de acceso |
|---|---|
| Administrador / Superadmin | Acceso total, incluyendo gestión de usuarios, consola del sistema y sincronización en la nube |
| Operador / Cajero | Acceso a las funciones operativas según permisos asignados |

---

## Relación con otros módulos

- Los permisos configurados aquí controlan qué puede hacer cada usuario en **todos los demás módulos**
- Los respaldos locales y la sincronización con Turso protegen toda la información del sistema: clientes, pagos, facturas, lecturas y configuración
- Para detalles técnicos sobre la réplica en la nube, consultar [sincronizacion-turso-cloud.md](https://github.com/Mahynlo/Api-AguaVp/blob/pruebas/docs/SINCRONIZACION_TURSO_CLOUD.md)
