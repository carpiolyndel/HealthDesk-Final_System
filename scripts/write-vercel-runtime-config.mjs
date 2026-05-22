import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const rawBackendUrl =
  process.env.HEALTHDESK_API_BASE_URL ||
  process.env.RENDER_BACKEND_URL ||
  '';

if (!rawBackendUrl) {
  throw new Error('Set HEALTHDESK_API_BASE_URL to your Render backend API URL, for example https://healthdesk-backend.onrender.com/api');
}

const apiBaseUrl = rawBackendUrl.endsWith('/api')
  ? rawBackendUrl
  : `${rawBackendUrl.replace(/\/$/, '')}/api`;

const content = `window.HEALTHDESK_API_BASE_URL = '${apiBaseUrl}';\n`;
const targets = [
  'src/main/resources/static/app/js/runtime-config.js',
  'src/main/resources/static/guest/js/runtime-config.js'
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}

console.log(`Wrote Vercel runtime config for ${apiBaseUrl}`);
