// Regenerates public/og-image.png: three scenario pages captured at phone
// size in dark mode, centred in a 3:2 crop of the 1200×630 social preview.
// Run with `npm run og` (builds the site first). Uses the installed Chrome.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { build, preview } from 'astro';
import { chromium } from 'playwright-core';

const SCENARIOS = ['undiagnosed-astigmatism', 'essential-tremor', 'tinnitus'];
const OUT = new URL('../public/og-image.png', import.meta.url);

const IMAGE = { width: 1200, height: 630 };
const PHONE = { width: 360, height: 780 };
const PHONE_SCALE = 0.685; // phone height ≈ 85% of the image height
const GAP = 44;

// Background is the hue opposite the theme highlight, kept very dark.
const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const pink = css.match(/--pink:\s*(#[0-9a-f]{6})/i)[1];
const background = `hsl(${(hueOf(pink) + 180) % 360} 100% 9%)`;

await build({ logLevel: 'warn' });
// Astro falls back to another port if this one is taken but still reports the
// one it was given, so pick a free port and check it serves this build.
const port = await freePort();
const server = await preview({ logLevel: 'warn', server: { port } });
const origin = `http://localhost:${port}`;
const base = (await import('../astro.config.mjs')).default.base.replace(/\/?$/, '/');

let browser;
try {
  const built = await readFile(new URL(`../dist/scenarios/${SCENARIOS[0]}/index.html`, import.meta.url), 'utf8');
  const served = await (await fetch(`${origin}${base}scenarios/${SCENARIOS[0]}/`)).text();
  if (served !== built) throw new Error(`${origin} is not serving this build`);

  browser = await chromium.launch({ channel: 'chrome' });
  const phone = await browser.newPage({
    viewport: PHONE,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const shots = [];
  for (const slug of SCENARIOS) {
    const res = await phone.goto(`${origin}${base}scenarios/${slug}/`, { waitUntil: 'networkidle' });
    if (!res.ok()) throw new Error(`${slug}: HTTP ${res.status()}`);
    await phone.evaluate(() => document.fonts.ready);
    shots.push((await phone.screenshot()).toString('base64'));
  }

  const card = await browser.newPage({ viewport: IMAGE });
  await card.setContent(`
    <style>
      body {
        margin: 0;
        width: ${IMAGE.width}px;
        height: ${IMAGE.height}px;
        background: ${background};
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${GAP}px;
      }
      img {
        width: ${Math.round(PHONE.width * PHONE_SCALE)}px;
        height: ${Math.round(PHONE.height * PHONE_SCALE)}px;
        border-radius: 22px;
        box-shadow: 0 6px 20px rgb(0 0 0 / 0.35), 0 1px 4px rgb(0 0 0 / 0.25);
      }
    </style>
    ${shots.map((s) => `<img src="data:image/png;base64,${s}" alt="">`).join('')}
  `);
  await card.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
  await card.screenshot({ path: OUT.pathname });
  console.log(`Wrote ${OUT.pathname} (background ${background} from --pink ${pink})`);
} finally {
  await browser?.close();
  await server.stop();
}

function hueOf(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer().listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}
