const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = __dirname;
const outputDir = path.resolve(sourceRoot, 'cloudflare pages');
const sourceFiles = [
  '_headers',
  'index.html',
  'assets/styles.css',
  'assets/app.js',
  'assets/mobile-viewport.js',
  'assets/favicon.svg',
  'assets/fondo-floral-negro.png',
  'assets/patreon-icon.png',
  'assets/twitch-glitch.svg',
  'assets/youtube-icon.png',
  'functions/api/twitch-channel.js',
  'functions/api/site-config.js',
];

const relativeOutput = path.relative(sourceRoot, outputDir);
if (!relativeOutput || relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput)) {
  throw new Error('La carpeta de salida debe estar dentro de Holisofi Live.');
}

for (const relativePath of sourceFiles) {
  const fullPath = path.join(sourceRoot, relativePath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    throw new Error(`Falta un archivo necesario para publicar: ${relativePath}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
for (const relativePath of sourceFiles) {
  const destination = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, relativePath), destination);
}

console.log(`Carpeta lista para Cloudflare Pages: ${outputDir}`);
console.log(`Archivos copiados: ${sourceFiles.length}`);
