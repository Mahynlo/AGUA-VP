# AGUA-VP


**AGUA-VP** es un sistema integral de gestión de servicios de agua construido como una aplicación de escritorio moderna. Su objetivo principal es optimizar los procesos administrativos de comités o entidades locales mediante la digitalización del registro de consumo de agua. La aplicación facilita la captura del flujo de lecturas de medidores de los usuarios, manteniendo un control preciso y organizado de los datos.

Para lograr esto, AGUA-VP se apoya en un robusto *stack* de tecnologías web modernas, garantizando un rendimiento fluido como aplicación multiplataforma (Windows, macOS y Linux).

### Tecnologías principales:

* **Electron:** Entorno de ejecución que permite empaquetar la solución web como un programa de escritorio nativo.
* **React:** Biblioteca principal para la construcción de una interfaz de usuario dinámica y reactiva.
* **Tailwind CSS:** Framework de estilos que otorga un diseño visual limpio, moderno y escalable.
* **Vite:** Herramienta de empaquetado y entorno de desarrollo rápido.

Toda su arquitectura técnica está orientada específicamente a resolver la lógica de negocio relacionada con el control, almacenamiento y flujo de datos de los servicios de agua locales.

## Configuración IDE recomendada

- [Código VS](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Configuración del proyecto

### Instalar (Dependencias)

```bash
$ npm instalar
```

### Desarrollo (Corer el proyecto en modo de desarrollo)

```bash
$ npm ejecuta dev
```

### Construir (Compilar para producción)

```bash
# Para ventanas
$ npm ejecuta build:win

# Para macOS
$ npm ejecuta build:mac

# Para Linux
$ npm run build:linux
```
