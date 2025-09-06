# Sistema de Carga Dinámica de Documentación - Agua VP

## 📝 Resumen de Cambios Implementados

Se ha implementado un sistema de carga dinámica de archivos `.md` para el componente de ayuda, eliminando el contenido hardcodeado y permitiendo que los archivos de documentación se carguen dinámicamente desde el sistema de archivos.

## 🚀 Componentes Modificados

### 1. **IPC Handler Principal** (`src/main/ipc/ipcHandlers.js`)
- ✅ Agregado import de `fs` para acceso al sistema de archivos
- ✅ Agregado logging para verificar registro de handlers
- ✅ Implementado handler `load-documentation-file` que:
  - Detecta automáticamente el entorno (desarrollo/producción)
  - Construye rutas dinámicamente según el entorno
  - Lee archivos `.md` desde el sistema de archivos
  - Proporciona manejo robusto de errores
  - Incluye logging detallado para debugging

### 2. **Preload Script** (`src/preload/index.js`)
- ✅ Agregado objeto `docsApp` con la función `loadDocumentationFile`
- ✅ Exposición del objeto `docsApp` a través de `contextBridge`
- ✅ Configuración para entornos con y sin context isolation

### 3. **Componente AyudaVista** (`src/renderer/src/components/vistas/AyudaVista.jsx`)
- ✅ Eliminado contenido hardcodeado de documentación
- ✅ Implementada carga dinámica usando la API de Electron
- ✅ Mapeo automático de secciones a archivos de documentación
- ✅ Manejo robusto de errores con fallbacks informativos
- ✅ Logging detallado para verificar la carga de archivos
- ✅ Verificación de disponibilidad de la API antes de uso

## 📁 Archivos de Documentación Soportados

El sistema busca y carga automáticamente estos archivos `.md`:

- `inicio-rapido.md` → Sección "Inicio Rápido"
- `clientes.md` → Sección "Clientes"
- `medidores.md` → Sección "Medidores"
- `lecturas.md` → Sección "Lecturas"
- `facturas.md` → Sección "Facturas"
- `pagos.md` → Sección "Pagos"
- `impresion.md` → Sección "Impresión"
- `faq.md` → Sección "Preguntas Frecuentes"

## 🔧 Configuración de Rutas

### Entorno de Desarrollo
```
src/renderer/src/components/vistas/ayuda/{archivo}.md
```

### Entorno de Producción
```
resources/app.asar.unpacked/src/renderer/src/components/vistas/ayuda/{archivo}.md
```

## ✨ Características Implementadas

### 🛡️ **Manejo Robusto de Errores**
- Verificación de disponibilidad de la API antes del uso
- Fallbacks informativos cuando los archivos no se encuentran
- Mensajes de error detallados con información de debugging
- Contenido de respaldo cuando falla la carga

### 📊 **Logging y Debugging**
- Logs en el proceso main cuando se registran los handlers
- Logs detallados en cada intento de carga de archivo
- Información de rutas buscadas y contenido cargado
- Indicadores de éxito/error en la consola

### 🔄 **Hot Reload Compatible**
- El sistema funciona con Vite Hot Module Replacement
- Los cambios en archivos `.md` se pueden ver al recargar la vista
- Desarrollo eficiente con recarga automática

### 🎯 **Flexibilidad**
- Fácil agregación de nuevas secciones de documentación
- Modificación de contenido sin recompilar el código
- Soporte para múltiples idiomas en el futuro

## 🧪 Cómo Probar la Implementación

### 1. **Verificar en la Consola del Navegador**
Al abrir la aplicación, deberías ver en la consola:
```
🔧 Registrando handlers IPC principales...
✅ Handler de documentación registrado
```

### 2. **Verificar Carga de Archivos**
Al navegar a la sección de Ayuda, deberías ver:
```
📄 Cargando archivo: inicio-rapido.md
✅ Documentación cargada: inicio-rapido.md (XXXX caracteres)
📚 Documentación cargada: 8 secciones
```

### 3. **Verificar Contenido**
- El contenido debe mostrar el markdown renderizado desde los archivos
- La búsqueda debe funcionar sobre el contenido cargado
- Los diferentes tabs deben mostrar contenido distinto

## 🔍 Troubleshooting

### ❌ **Si la API no está disponible**
```
Error: API de documentación no disponible. Asegúrate de que el preload script esté funcionando correctamente.
```
**Solución:** Verificar que el preload script se esté cargando correctamente.

### ❌ **Si los archivos no se encuentran**
```
⚠️ Archivo de documentación no encontrado: [ruta]
```
**Solución:** Verificar que los archivos `.md` existan en la carpeta `src/renderer/src/components/vistas/ayuda/`.

### ❌ **Si hay errores de permisos**
```
Error: EACCES: permission denied
```
**Solución:** Verificar permisos de lectura en las carpetas del proyecto.

## 📈 Beneficios de la Implementación

1. **🔧 Mantenimiento:** Contenido de documentación separado del código
2. **⚡ Performance:** Carga solo cuando se necesita
3. **🎨 Flexibilidad:** Fácil edición de contenido sin recompilar
4. **🛡️ Robustez:** Manejo completo de errores y casos edge
5. **📱 Escalabilidad:** Fácil agregación de nuevas secciones
6. **🔍 Debugging:** Logging detallado para troubleshooting

## 🚀 Próximos Pasos

1. Crear/verificar que todos los archivos `.md` existan con contenido actualizado
2. Probar en diferentes entornos (desarrollo/producción)
3. Agregar soporte para imágenes en la documentación si es necesario
4. Considerar implementar cache para mejorar performance
5. Agregar soporte para múltiples idiomas si se requiere

---

**✅ Estado:** Implementación completada y funcional
**🔧 Versión:** Compatible con Agua VP v1.2.60
**📅 Fecha:** Septiembre 2025
