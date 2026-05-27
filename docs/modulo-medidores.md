# Módulo: Medidores

## ¿Qué es?

El módulo de Medidores gestiona el inventario de los aparatos físicos de medición instalados en campo. Un medidor es el dispositivo que registra cuántos metros cúbicos de agua consume un usuario. El sistema mantiene un registro digital de cada medidor: dónde está, quién lo tiene asignado y su estado.

---

## ¿Qué se puede hacer aquí?

- **Registrar** nuevos medidores en el inventario (número de serie, marca, modelo, fecha de instalación)
- **Ver el inventario** completo con filtros por estado o asignación
- **Ver en el mapa** la ubicación geográfica de cada medidor
- **Editar** los datos de un medidor (por ejemplo, si se reemplaza el aparato)
- **Asignar o desasignar** medidores a clientes

---

## Vistas disponibles

### Inventario (lista)

Tabla con todos los medidores registrados. Muestra número de serie, cliente asignado, estado y fecha de instalación. Permite buscar y filtrar.

### Mapa

Vista geográfica que muestra los medidores como puntos sobre un mapa. Útil para planificar rutas de lectura o identificar medidores en una zona específica.

---

## Estados de un medidor

| Estado | Significado |
|---|---|
| Disponible | En inventario, sin cliente asignado |
| Asignado | Instalado y vinculado a un cliente activo |
| En mantenimiento | Temporalmente fuera de servicio |

---

## Relación con otros módulos

- Cada **cliente** activo debe tener un medidor asignado
- Los medidores son la base de las **rutas de lectura** — solo los medidores asignados pueden incluirse en una ruta
- Al registrar una lectura, se selecciona el medidor de donde proviene el consumo
