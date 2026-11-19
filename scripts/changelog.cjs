/**
 * Changelog de AGUA-VP (docs/releases_changelog.md).
 *
 * Automatiza lo mecánico del registro de versiones; la redacción para el usuario la sigue haciendo
 * una persona (los commits son técnicos y no siempre siguen el mismo formato).
 *
 *   node scripts/changelog.cjs nueva <tag|sufijo>   Agrega arriba el borrador de la sección de esa versión:
 *                                                    encabezado, fecha, versiones previas, servidor embebido
 *                                                    y los commits desde la versión anterior, agrupados.
 *   node scripts/changelog.cjs verificar <tag>      Falla si la versión no tiene sección o si sigue siendo
 *                                                    borrador (lo usan release:push / prerelease:push y el CI).
 *   node scripts/changelog.cjs extraer <tag> [archivo]  Solo la sección de esa versión (notas del release).
 *   node scripts/changelog.cjs sincronizar          Copia docs/ → resources/ (la que se empaqueta en la app).
 *
 * <tag> es el tag completo (v1.3.1, v1.3.1-rc.3) o solo el sufijo de pre-release (rc.3), que se completa
 * con la versión de package.json.
 *
 * Formato de cada sección (el que lee la app, ver parseChangelogMarkdown en src/main/managers/updateManager.js):
 *   ## 🧪 Notas de la versión — v1.3.1-rc.3 [Release Candidate]
 *   **📅 Fecha de lanzamiento:** dd/mm/aaaa
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CHANGELOG = path.join(RAIZ, 'docs', 'releases_changelog.md');
const COPIA_EMPAQUETADA = path.join(RAIZ, 'resources', 'releases_changelog.md');
const MARCA_BORRADOR = '**BORRADOR**';

function fallar(mensaje) {
  console.error(`[changelog] ${mensaje}`);
  process.exit(1);
}

function leer(archivo) {
  return fs.readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n');
}

function versionPaquete() {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).version;
}

/** Acepta "v1.3.1", "1.3.1-rc.3" o un sufijo "rc.3"; devuelve la versión sin "v". */
function normalizarVersion(valor) {
  if (!valor) fallar('Indica la versión: un tag (v1.3.1, v1.3.1-rc.3) o un sufijo (rc.3)');
  const limpio = String(valor).trim().replace(/^v/, '');
  if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(limpio)) return limpio;
  if (/^[0-9A-Za-z][0-9A-Za-z.-]*$/.test(limpio)) return `${versionPaquete()}-${limpio}`;
  fallar(`Versión no válida: ${valor}`);
}

function parsear(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(version).replace(/^v/, ''));
  if (!m) return null;
  return { mayor: +m[1], menor: +m[2], parche: +m[3], pre: m[4] || null };
}

/** Compara versiones semver (las pre-release van antes que la estable). */
function comparar(a, b) {
  const pa = parsear(a);
  const pb = parsear(b);
  for (const k of ['mayor', 'menor', 'parche']) if (pa[k] !== pb[k]) return pa[k] - pb[k];
  if (pa.pre === pb.pre) return 0;
  if (!pa.pre) return 1;
  if (!pb.pre) return -1;
  // rc.10 > rc.9: comparar por partes, numéricas como número
  const xa = pa.pre.split('.');
  const xb = pb.pre.split('.');
  for (let i = 0; i < Math.max(xa.length, xb.length); i++) {
    if (xa[i] === undefined) return -1;
    if (xb[i] === undefined) return 1;
    const na = /^\d+$/.test(xa[i]);
    const nb = /^\d+$/.test(xb[i]);
    if (na && nb && +xa[i] !== +xb[i]) return +xa[i] - +xb[i];
    if (xa[i] !== xb[i]) return xa[i].localeCompare(xb[i]);
  }
  return 0;
}

function tipoDeVersion(version) {
  const pre = parsear(version).pre;
  if (!pre) return { icono: '🚀', etiqueta: 'Estable', descripcion: 'Estable' };
  if (/^rc/i.test(pre)) return { icono: '🧪', etiqueta: 'Release Candidate', descripcion: 'Pre-release / Versión Candidata de Evaluación' };
  if (/^beta/i.test(pre)) return { icono: '🧪', etiqueta: 'Beta', descripcion: 'Pre-release / Versión Beta' };
  return { icono: '🧪', etiqueta: 'Pre-release', descripcion: 'Pre-release' };
}

// ── Secciones del archivo ─────────────────────────────────────────────────────

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Encabezado de una sección de versión (## … Notas de la versión — vX.Y.Z …); el "# Notas de la versión
// anterior" de las versiones viejas también cuenta como inicio de sección
const INICIO_SECCION = /^#{1,2}\s+.*Notas de la versi/;

/** Texto de la sección de `version` (sin el separador ---), o null. */
function seccionDe(contenido, version) {
  const lineas = contenido.split('\n');
  const encabezado = new RegExp(`^#{1,2}\\s+.*Notas de la versi.*\\bv${escapar(version)}(?![0-9A-Za-z.-])`);
  const inicio = lineas.findIndex((l) => encabezado.test(l));
  if (inicio === -1) return null;
  let fin = lineas.length;
  for (let i = inicio + 1; i < lineas.length; i++) {
    if (INICIO_SECCION.test(lineas[i])) {
      fin = i;
      break;
    }
  }
  const cuerpo = lineas.slice(inicio, fin);
  // Quitar los separadores y líneas vacías del final (pertenecen al espacio entre secciones)
  while (cuerpo.length && /^(\s*|-{3,}\s*)$/.test(cuerpo[cuerpo.length - 1])) cuerpo.pop();
  return cuerpo.join('\n') + '\n';
}

// ── Git ───────────────────────────────────────────────────────────────────────

function git(args) {
  const r = spawnSync('git', args, { cwd: RAIZ, encoding: 'utf8' });
  if (r.status !== 0) fallar(`git ${args.join(' ')} falló: ${(r.stderr || '').trim()}`);
  return (r.stdout || '').trim();
}

/** Tags vX.Y.Z[-pre] del repositorio, ordenados de menor a mayor. */
function tagsVersion() {
  return git(['tag', '--list', 'v*'])
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => parsear(t))
    .sort((a, b) => comparar(a, b));
}

/**
 * Versión con la que se compara la nueva: para una estable, la estable anterior (sus notas resumen
 * todo lo de sus pre-releases); para una pre-release, el tag anterior de cualquier tipo.
 */
function anteriores(version) {
  const menores = tagsVersion().filter((t) => comparar(t, version) < 0);
  const estables = menores.filter((t) => !parsear(t).pre);
  const base = parsear(version);
  const preMismaVersion = menores.filter((t) => {
    const p = parsear(t);
    return p.pre && p.mayor === base.mayor && p.menor === base.menor && p.parche === base.parche;
  });
  return {
    estable: estables[estables.length - 1] || null,
    prePrevia: preMismaVersion[preMismaVersion.length - 1] || null,
    desde: base.pre ? menores[menores.length - 1] || null : estables[estables.length - 1] || null
  };
}

// Tipos de commit (convencionales y, para los que no lo son, por la primera palabra)
const GRUPOS = [
  { clave: 'feat', titulo: '### ✨ Novedades' },
  { clave: 'fix', titulo: '### 🐞 Correcciones' },
  { clave: 'perf', titulo: '### ⚡ Rendimiento' },
  { clave: 'ui', titulo: '### 🖥️ Mejoras de interfaz' },
  { clave: 'refactor', titulo: '### 🧹 Mantenimiento interno' },
  { clave: 'docs', titulo: '### 📚 Documentación y ayuda' },
  { clave: 'calidad', titulo: '### 🧪 Calidad y desarrollo' },
  { clave: 'otros', titulo: '### 📝 Otros cambios' }
];
const TIPO_CONVENCIONAL = { feat: 'feat', fix: 'fix', perf: 'perf', style: 'ui', refactor: 'refactor', docs: 'docs', test: 'calidad', ci: 'calidad', build: 'calidad', chore: 'calidad' };

function clasificar(asunto) {
  const conv = /^(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/.exec(asunto);
  if (conv && TIPO_CONVENCIONAL[conv[1].toLowerCase()]) {
    return { grupo: TIPO_CONVENCIONAL[conv[1].toLowerCase()], ambito: conv[2] || null, texto: conv[3] };
  }
  const t = asunto.toLowerCase();
  let grupo = 'otros';
  if (/^(refactor|refactoriza|reorganiza)/.test(t)) grupo = 'refactor';
  else if (/documentaci|readme|\bdocs?\b/.test(t)) grupo = 'docs';
  else if (/^(optimiza|mejora(r)? (el )?rendimiento)/.test(t)) grupo = 'perf';
  else if (/^(fix|corrige|corregir|corrección|arregla)/.test(t)) grupo = 'fix';
  else if (/^(add|agrega|añade|implementa|nuevo|nueva)/.test(t)) grupo = 'feat';
  else if (/^(test|pruebas?)/.test(t)) grupo = 'calidad';
  return { grupo, ambito: null, texto: asunto };
}

// Commits que no aportan a las notas (cambios del propio changelog, versión, merges)
const IGNORAR = /^(merge\b|bump version|.*\b(changelog|release notes)\b)/i;

function esAncestro(ref) {
  return spawnSync('git', ['merge-base', '--is-ancestor', ref, 'HEAD'], { cwd: RAIZ }).status === 0;
}

/**
 * Asuntos de los commits de HEAD posteriores a `ref`. Si el tag no está en el historial de la rama
 * actual (historial reescrito: el tag apunta al commit original y la rama tiene una copia con otro
 * hash), `ref..HEAD` incluiría casi todo; en ese caso se toman los commits con fecha de autor
 * posterior a la del commit del tag (la fecha de autor se conserva al reescribir).
 */
function commitsDesde(ref) {
  let lineas;
  if (!ref) {
    lineas = git(['log', '--no-merges', '-n', '50', '--format=%s', 'HEAD']).split('\n');
  } else if (esAncestro(ref)) {
    lineas = git(['log', '--no-merges', '--format=%s', `${ref}..HEAD`]).split('\n');
  } else {
    const fechaTag = Number(git(['log', '-1', '--format=%at', ref]));
    console.warn(`[changelog] ${ref} no está en el historial de esta rama: se toman los commits con fecha posterior a la suya.`);
    lineas = git(['log', '--no-merges', '--format=%at\t%s', 'HEAD'])
      .split('\n')
      .map((l) => l.split('\t'))
      .filter(([at]) => Number(at) > fechaTag)
      .map(([, ...asunto]) => asunto.join('\t'));
  }
  return lineas.map((s) => s.trim()).filter((s) => s && !IGNORAR.test(s));
}

// ── Comandos ──────────────────────────────────────────────────────────────────

function versionServidorEmbebido() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'node_modules', '@aguavp', 'api-server', 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return '?';
  }
}

function fechaSonora() {
  // dd/mm/aaaa en hora de Sonora, el mismo formato de las secciones existentes
  return new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Hermosillo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
}

function borrador(version) {
  const tipo = tipoDeVersion(version);
  const { estable, prePrevia, desde } = anteriores(version);
  const commits = commitsDesde(desde);

  const porGrupo = new Map(GRUPOS.map((g) => [g.clave, []]));
  for (const asunto of commits) {
    const { grupo, ambito, texto } = clasificar(asunto);
    const frase = texto.charAt(0).toUpperCase() + texto.slice(1);
    porGrupo.get(grupo).push(`- ${ambito ? `**${ambito}:** ` : ''}${frase}`);
  }

  const l = [];
  l.push(`## ${tipo.icono} Notas de la versión — v${version} [${tipo.etiqueta}]`, '');
  l.push(`**📅 Fecha de lanzamiento:** ${fechaSonora()}  `);
  l.push(`**🚀 Versión:** \`v${version}\` [${tipo.descripcion}]  `);
  if (estable) l.push(`**📌 Versión base anterior estable:** \`${estable}\`  `);
  if (prePrevia) l.push(`**🔖 Pre-release precedente:** \`${prePrevia}\`  `);
  l.push(`**🧩 Servidor embebido:** \`@aguavp/api-server ${versionServidorEmbebido()}\``, '');
  l.push(`> 📝 ${MARCA_BORRADOR} generado desde ${commits.length} commit(s) ${desde ? `desde \`${desde}\`` : '(sin versión anterior)'}. Reescribe cada punto pensando en quien usa la app (qué cambió y qué debe hacer), quita lo que no le afecte y borra esta línea. No se puede publicar mientras esta línea exista.`, '');
  if (tipo.etiqueta !== 'Estable') {
    l.push('> ⚠️ **Aviso de Pre-release:** _resume en una o dos líneas qué trae esta versión y qué conviene probar._', '');
  }
  l.push('---', '');
  for (const g of GRUPOS) {
    const items = porGrupo.get(g.clave);
    if (items.length) l.push(g.titulo, ...items, '');
  }
  if (!commits.length) l.push('_Sin commits desde la versión anterior._', '');
  return l.join('\n');
}

function nueva(valor) {
  const version = normalizarVersion(valor);
  const contenido = leer(CHANGELOG);
  if (seccionDe(contenido, version)) fallar(`v${version} ya tiene sección en docs/releases_changelog.md`);

  // Se inserta antes de la primera sección (debajo del título del archivo)
  const lineas = contenido.split('\n');
  const primera = lineas.findIndex((l) => INICIO_SECCION.test(l));
  const pos = primera === -1 ? lineas.length : primera;
  const nuevoContenido = [...lineas.slice(0, pos), borrador(version), '---', '', ...lineas.slice(pos)].join('\n');

  fs.writeFileSync(CHANGELOG, nuevoContenido, 'utf8');
  console.log(`[changelog] Borrador de v${version} agregado al inicio de docs/releases_changelog.md.`);
  console.log('[changelog] Revísalo y reescríbelo; al terminar borra la línea del BORRADOR.');
}

function sincronizar({ silencioso = false } = {}) {
  const contenido = fs.readFileSync(CHANGELOG, 'utf8');
  const actual = fs.existsSync(COPIA_EMPAQUETADA) ? fs.readFileSync(COPIA_EMPAQUETADA, 'utf8') : null;
  if (actual === contenido) {
    if (!silencioso) console.log('[changelog] resources/releases_changelog.md ya está al día.');
    return;
  }
  fs.writeFileSync(COPIA_EMPAQUETADA, contenido, 'utf8');
  console.log('[changelog] resources/releases_changelog.md actualizado desde docs/.');
}

function verificar(valor) {
  const version = normalizarVersion(valor);
  const seccion = seccionDe(leer(CHANGELOG), version);
  const errores = [];
  if (!seccion) {
    errores.push(`v${version} no tiene sección en docs/releases_changelog.md. Créala con: npm run changelog:nueva -- v${version}`);
  } else {
    if (seccion.includes(MARCA_BORRADOR)) errores.push(`La sección de v${version} sigue siendo un borrador: revísala y borra la línea del ${MARCA_BORRADOR}.`);
    if (!/\*\*📅 Fecha de lanzamiento:\*\*/.test(seccion)) errores.push(`La sección de v${version} no tiene la línea "**📅 Fecha de lanzamiento:**" (la app la usa para mostrar la fecha).`);
  }
  // La copia empaquetada la actualiza el build (prebuild → sincronizar); aquí solo se avisa
  if (!fs.existsSync(COPIA_EMPAQUETADA) || leer(COPIA_EMPAQUETADA) !== leer(CHANGELOG)) {
    console.warn('[changelog] Aviso: resources/releases_changelog.md no coincide con docs/ (se actualiza al compilar; para el repositorio: npm run changelog:sincronizar).');
  }
  if (errores.length) fallar(`No está listo para publicar v${version}:\n  - ${errores.join('\n  - ')}`);
  console.log(`[changelog] v${version}: sección lista para publicar.`);
}

function extraer(valor, destino) {
  const version = normalizarVersion(valor);
  const seccion = seccionDe(leer(CHANGELOG), version);
  if (!seccion) fallar(`v${version} no tiene sección en docs/releases_changelog.md`);
  if (destino) {
    fs.writeFileSync(path.resolve(destino), seccion, 'utf8');
    console.log(`[changelog] Notas de v${version} escritas en ${destino}.`);
  } else {
    process.stdout.write(seccion);
  }
}

function main() {
  const [comando, valor, destino] = process.argv.slice(2);
  switch (comando) {
    case 'nueva': return nueva(valor);
    case 'verificar': return verificar(valor);
    case 'extraer': return extraer(valor, destino);
    case 'sincronizar': return sincronizar({ silencioso: valor === '--silencioso' });
    default:
      console.log([
        'Uso:',
        '  npm run changelog:nueva -- rc.3        (o -- v1.3.1)',
        '  npm run changelog:verificar -- v1.3.1-rc.3',
        '  npm run changelog:sincronizar',
        '  node scripts/changelog.cjs extraer v1.3.1-rc.3 [archivo]'
      ].join('\n'));
      if (comando) fallar(`Comando no reconocido: ${comando}`);
  }
}

if (require.main === module) main();

module.exports = { seccionDe, verificar, normalizarVersion, comparar };
