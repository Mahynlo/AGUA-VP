# Publicar nuevas versiones

## Cómo funciona el sistema de versiones

La versión de la app se define en el campo `"version"` de `package.json`. Cuando se crea un tag de git con el formato `v<versión>` y se sube a GitHub, el sistema de CI (GitHub Actions) compila automáticamente la app y publica el instalador en GitHub Releases.

---

## Notas de la versión (changelog)

Las notas viven en `docs/releases_changelog.md`: la app las muestra en el Centro de Actualizaciones y el CI publica en GitHub **solo la sección de la versión** del tag. `resources/releases_changelog.md` es la copia que se empaqueta; se actualiza sola al compilar (`npm run build`).

```bash
# 1. Crear el borrador de la versión (con el sufijo o el tag completo)
npm run changelog:nueva -- rc.3        # → v<versión de package.json>-rc.3
npm run changelog:nueva -- v1.3.1      # → estable

# 2. Editar docs/releases_changelog.md: el borrador trae el encabezado, la fecha, las versiones previas,
#    la versión del servidor embebido y los commits desde la versión anterior agrupados por tipo.
#    Reescribir cada punto para quien usa la app y borrar la línea del **BORRADOR**.

# 3. Comprobar que está listo (también lo hacen release:push / prerelease:push y el CI)
npm run changelog:verificar -- v1.3.1-rc.3

# 4. Commit del changelog y publicar el tag como siempre
```

No se puede subir un tag (ni el CI lo publica) si su versión no tiene sección o si sigue siendo borrador.

---

## Publicar una versión estable

```bash
# 1. Editar "version" en package.json, por ejemplo: "1.2.531"

# 2. Commit y push del cambio de versión
git add package.json
git commit -m "Bump version to 1.2.531"
git push

# 3. Crear el tag y subirlo → esto dispara el build en CI
npm run release:push
```

---

## Publicar una versión de prueba (pre-release)

Se usa cuando se quiere probar el instalador antes de publicarlo como versión oficial. El número de versión en `package.json` no cambia.

```bash
npm run prerelease:push -- rc.1
# Crea y sube el tag v1.2.531-rc.1 → CI lo publica como pre-release
```

Sufijos comunes: `rc.1`, `rc.2`, `beta.1`, `beta.2`

---

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run release:new` | Crea el tag local sin subirlo |
| `npm run prerelease:new -- beta.1` | Crea el tag pre-release local sin subirlo |
| `npm run latest:tag` | Muestra el último tag publicado en GitHub |
| `npm run latest:release` | Muestra la última versión publicada (nombre, fecha, enlace) |

---

## Qué hace el CI automáticamente

Cuando detecta un tag `v*`:

1. Valida que el tag coincide con la versión en `package.json`
2. Revisa que la versión tenga notas listas en `docs/releases_changelog.md` y extrae solo su sección
2. Descarga y empaqueta el API embebida
3. Inyecta las variables de entorno secretas
4. Compila la app con `electron-builder`
5. Publica el instalador `.exe` en GitHub Releases
