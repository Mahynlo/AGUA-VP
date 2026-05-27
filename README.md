# AGUA-VP

**AGUA-VP** es un sistema de escritorio para la gestión administrativa de comités o entidades locales de agua potable. Digitaliza el ciclo completo del servicio: desde registrar clientes y medidores, tomar lecturas en campo, generar facturas y cobrar pagos, hasta imprimir recibos y producir reportes financieros.

La aplicación corre completamente en la computadora del usuario — no requiere internet para operar. Toda la información se guarda localmente en una base de datos SQLite embebida.

---

## Módulos principales

| Módulo | Qué hace |
|---|---|
| [Clientes](docs/modulo-clientes.md) | Registro y gestión de usuarios del servicio |
| [Medidores](docs/modulo-medidores.md) | Inventario de medidores físicos y su ubicación |
| [Lecturas y Rutas](docs/modulo-lecturas.md) | Captura de consumo mensual por rutas |
| [Tarifas](docs/modulo-tarifas.md) | Configuración de precios por rangos de consumo |
| [Pagos y Facturación](docs/modulo-pagos.md) | Cobros, convenios, cortes y deudores |
| [Impresión y Reportes](docs/modulo-impresion.md) | Recibos individuales y reportes generales |
| [Administración](docs/modulo-administracion.md) | Usuarios del sistema, permisos, respaldos y logs |

---

## Flujo de trabajo típico

```
1. Registrar clientes y asignarles un medidor + tarifa
        ↓
2. Crear una ruta de lectura (agrupación de medidores)
        ↓
3. Capturar las lecturas del mes → el sistema calcula el consumo
        ↓
4. Generar las facturas de la ruta
        ↓
5. Registrar los pagos cuando los clientes acuden a pagar
        ↓
6. Imprimir recibos y reportes del período
```

---

## Tecnologías

- **Electron** — empaqueta la app como programa de escritorio nativo
- **React + Vite** — interfaz de usuario dinámica y rápida
- **Tailwind CSS + Flowbite** — diseño visual moderno con modo oscuro
- **SQLite** (vía API embebida) — base de datos local, sin servidor externo
- **Node.js / Express** — lógica de negocio embebida en el proceso principal

---

## Configuración del proyecto

### Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

### Instalar dependencias

```bash
npm install
```

### Correr en modo desarrollo

```bash
npm run dev
```

Abre la ventana de Electron con hot-reload para React y recarga automática del proceso principal.

### Compilar para producción (Windows)

```bash
npm run build:win
```

Genera un instalador `.exe` en la carpeta `dist/`.

### Otros comandos

```bash
npm run lint       # Revisa y corrige el código con ESLint
npm run format     # Formatea el código con Prettier
```

---

## Publicar una nueva versión

1. Editar el campo `"version"` en `package.json`
2. Hacer commit y push del cambio
3. Ejecutar `npm run release:push` — crea el tag y lo sube a GitHub
4. GitHub Actions compila y publica el instalador automáticamente

Ver más detalles en [docs/releases.md](docs/releases.md).

---

## Estructura del proyecto

```
AguaVP/
├── src/
│   ├── main/           — Proceso principal de Electron (Node.js)
│   │   ├── ipc/        — Comunicación con la interfaz (un archivo por módulo)
│   │   └── managers/   — API embebida, logs, actualizaciones
│   ├── preload/        — Puente seguro entre main y renderer
│   └── renderer/       — Interfaz React (SPA)
│       └── src/
│           ├── components/vistas/  — Páginas de cada módulo
│           ├── context/            — Estado global por dominio
│           ├── hooks/              — Lógica reutilizable
│           └── utils/              — Funciones auxiliares
├── docs/               — Documentación detallada por módulo
└── package.json
```

---

## IDE recomendado

[Visual Studio Code](https://code.visualstudio.com/) con las extensiones **ESLint** y **Prettier**.
