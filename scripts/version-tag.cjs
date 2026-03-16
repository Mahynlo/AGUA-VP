const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appVersion = packageJson.version;

function fail(message) {
  console.error(`[version-tag] ${message}`);
  process.exit(1);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function gitOutput(args) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    fail(`No se pudo ejecutar git ${args.join(' ')}`);
  }

  return (result.stdout || '').trim();
}

function ensureGitRepo() {
  const isRepo = gitOutput(['rev-parse', '--is-inside-work-tree']);
  if (isRepo !== 'true') {
    fail('Este comando debe ejecutarse dentro del repositorio git de AGUA-VP');
  }
}

function ensureCleanTag(tag) {
  const existing = gitOutput(['tag', '--list', tag]);
  if (existing === tag) {
    fail(`El tag ${tag} ya existe localmente`);
  }
}

function ensureReleaseTag(tag) {
  if (tag !== `v${appVersion}`) {
    fail(`El tag de release estable debe ser v${appVersion}`);
  }
}

function ensurePrereleaseTag(tag) {
  const prereleasePattern = new RegExp(`^v${appVersion.replace(/\./g, '\\.')}[-][0-9A-Za-z.-]+$`);
  if (!prereleasePattern.test(tag)) {
    fail(`El tag de pre-release debe verse como v${appVersion}-rc.1 o v${appVersion}-beta.1`);
  }
}

function createTag(tag) {
  ensureCleanTag(tag);
  runGit(['tag', tag]);
  console.log(`[version-tag] Tag creado: ${tag}`);
}

function pushTag(tag) {
  const localTag = gitOutput(['tag', '--list', tag]);
  if (localTag !== tag) {
    createTag(tag);
  }
  runGit(['push', 'origin', tag]);
  console.log(`[version-tag] Tag enviado a origin: ${tag}`);
}

function buildPrereleaseTag(suffix) {
  if (!suffix) {
    fail('Debes indicar un sufijo de prerelease, por ejemplo: rc.1 o beta.1');
  }
  if (/^v/.test(suffix)) {
    return suffix;
  }
  return `v${appVersion}-${suffix}`;
}

function usage() {
  console.log([
    'Uso:',
    '  npm run release:new',
    '  npm run release:push',
    '  npm run prerelease:new -- rc.1',
    '  npm run prerelease:push -- rc.1',
    '  npm run version:new -- v1.2.529-rc.1',
    '  npm run version:push -- v1.2.529-rc.1',
    '  npm run latest:tag',
    '  npm run latest:release'
  ].join('\n'));
}

function parseSemverTag(tag) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(tag);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] || null
  };
}

function compareTagsDesc(a, b) {
  const pa = parseSemverTag(a);
  const pb = parseSemverTag(b);

  if (!pa && !pb) return b.localeCompare(a);
  if (!pa) return 1;
  if (!pb) return -1;

  if (pa.major !== pb.major) return pb.major - pa.major;
  if (pa.minor !== pb.minor) return pb.minor - pa.minor;
  if (pa.patch !== pb.patch) return pb.patch - pa.patch;

  if (pa.prerelease && !pb.prerelease) return 1;
  if (!pa.prerelease && pb.prerelease) return -1;
  if (!pa.prerelease && !pb.prerelease) return 0;

  return pa.prerelease.localeCompare(pb.prerelease);
}

function getLatestRemoteTag() {
  const output = gitOutput(['ls-remote', '--tags', '--refs', 'origin']);
  const tags = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t')[1])
    .filter(Boolean)
    .map((ref) => ref.replace('refs/tags/', ''));

  if (tags.length === 0) {
    fail('No se encontraron tags remotos en origin');
  }

  const sorted = tags.sort(compareTagsDesc);
  return sorted[0];
}

function parseGitHubRepoFromOrigin() {
  const origin = gitOutput(['remote', 'get-url', 'origin']);
  // soporta:
  // - https://github.com/owner/repo(.git)
  // - git@github.com:owner/repo(.git)
  let m = /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(origin);
  if (!m) {
    fail(`No se pudo detectar owner/repo desde origin: ${origin}`);
  }
  return { owner: m[1], repo: m[2] };
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'aguavp-version-tag-script',
        'Accept': 'application/vnd.github+json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
  });
}

async function getLatestGitHubRelease() {
  const { owner, repo } = parseGitHubRepoFromOrigin();
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const data = await fetchJson(url);
  return {
    tagName: data.tag_name,
    name: data.name,
    prerelease: data.prerelease,
    publishedAt: data.published_at,
    url: data.html_url
  };
}

async function main() {
  ensureGitRepo();

  const command = process.argv[2];
  const value = process.argv[3];

  switch (command) {
    case 'release:new': {
      const tag = `v${appVersion}`;
      ensureReleaseTag(tag);
      createTag(tag);
      break;
    }
    case 'release:push': {
      const tag = `v${appVersion}`;
      ensureReleaseTag(tag);
      pushTag(tag);
      break;
    }
    case 'prerelease:new': {
      const tag = buildPrereleaseTag(value);
      ensurePrereleaseTag(tag);
      createTag(tag);
      break;
    }
    case 'prerelease:push': {
      const tag = buildPrereleaseTag(value);
      ensurePrereleaseTag(tag);
      pushTag(tag);
      break;
    }
    case 'version:new': {
      if (!value) fail('Debes indicar el tag completo, por ejemplo v1.2.529-rc.1');
      if (value === `v${appVersion}`) {
        ensureReleaseTag(value);
      } else {
        ensurePrereleaseTag(value);
      }
      createTag(value);
      break;
    }
    case 'version:push': {
      if (!value) fail('Debes indicar el tag completo, por ejemplo v1.2.529-rc.1');
      if (value === `v${appVersion}`) {
        ensureReleaseTag(value);
      } else {
        ensurePrereleaseTag(value);
      }
      pushTag(value);
      break;
    }
    case 'latest:tag': {
      const latestTag = getLatestRemoteTag();
      console.log(`[version-tag] Ultimo tag remoto: ${latestTag}`);
      break;
    }
    case 'latest:release': {
      const release = await getLatestGitHubRelease();
      console.log(`[version-tag] Ultimo release en GitHub:`);
      console.log(`  tag: ${release.tagName}`);
      console.log(`  nombre: ${release.name || '(sin nombre)'}`);
      console.log(`  prerelease: ${release.prerelease ? 'si' : 'no'}`);
      console.log(`  publicado: ${release.publishedAt || '(sin fecha)'}`);
      console.log(`  url: ${release.url}`);
      break;
    }
    default:
      usage();
      fail(`Comando no reconocido: ${command || '(vacío)'}`);
  }
}

main().catch((err) => {
  fail(err.message || String(err));
});