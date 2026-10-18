// Regenerates public/og-image.png: three scenario pages captured at phone
// size in dark mode, centred in a 3:2 crop of the 1200×630 social preview.
// Run with `npm run og` (builds the site first). Uses the installed Chrome.
// `npm run og -- --cover <path>` also writes a 2× copy to <path>, for sites
// that show it larger than a social preview.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { build, preview } from 'astro';
import { chromium } from 'playwright-core';

const SCENARIOS = ['fractured-fingers', 'tinnitus', 'no-documents'];
const OUT = new URL('../public/og-image.png', import.meta.url);
const { cover } = parseArgs({ options: { cover: { type: 'string' } } }).values;
const outputs = [{ path: OUT.pathname, scale: 1 }];
if (cover) outputs.push({ path: resolve(process.env.INIT_CWD ?? '.', cover), scale: 2 });

const IMAGE = { width: 1200, height: 630 };
const PHONE = { width: 360, height: 780 };
const PHONE_SCALE = 0.685; // phone height ≈ 85% of the image height
const GAP = 44;
// The scenario text is enlarged so it reads at preview size: until the longest
// scenario (by characters) fills this share of the space between its top and
// the button, and the others take the same size.
const FILL = 0.8;
// The button label is enlarged too (16px on the site), and lifted off the
// bottom edge by the side gutter: on phones the site sits it flush on the
// browser's toolbar, which the preview doesn't have.
const PREVIEW_CSS = `
  .cta { font-size: 18px; }
  .cta__wrapper { padding-bottom: var(--gutter); }
`;

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
  const newPhone = (deviceScaleFactor) => browser.newPage({ viewport: PHONE, deviceScaleFactor, colorScheme: 'dark' });
  const open = async (phone, slug) => {
    const res = await phone.goto(`${origin}${base}scenarios/${slug}/`, { waitUntil: 'networkidle' });
    if (!res.ok()) throw new Error(`${slug}: HTTP ${res.status()}`);
    await phone.addStyleTag({ content: PREVIEW_CSS });
    await phone.evaluate(() => document.fonts.ready);
  };

  // Sizes are in CSS pixels, so fitting doesn't depend on the pixel density.
  const phone = await newPhone(1);
  let longest = { slug: null, length: -1 };
  for (const slug of SCENARIOS) {
    await open(phone, slug);
    const length = await phone.evaluate(scenarioLength);
    if (length > longest.length) longest = { slug, length };
  }
  await open(phone, longest.slug);
  let [fontSize, hi] = [8, 80];
  while (hi - fontSize > 0.1) {
    const size = (fontSize + hi) / 2;
    await phone.evaluate(setScenarioSize, size);
    if ((await phone.evaluate(scenarioFill)) > FILL) hi = size;
    else fontSize = size;
  }
  console.log(`Scenario text at ${fontSize.toFixed(1)}px, fitted to ${longest.slug}`);

  await phone.close();

  for (const { path, scale } of outputs) {
    // Each phone is captured at the pixel density it's shown at in the card, so
    // the text is rasterised at its final size instead of being scaled down.
    const width = Math.round(PHONE.width * PHONE_SCALE * scale);
    const shooter = await newPhone(width / PHONE.width);
    const shots = [];
    for (const slug of SCENARIOS) {
      await open(shooter, slug);
      await shooter.evaluate(setScenarioSize, fontSize);
      shots.push(await shooter.screenshot());
    }
    await shooter.close();

    // Shown at exactly one image pixel per screenshot pixel.
    const [w, h] = [16, 20].map((offset) => shots[0].readUInt32BE(offset) / scale);
    const html = `
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
          width: ${w}px;
          height: ${h}px;
          border-radius: 22px;
          box-shadow: 0 6px 20px rgb(0 0 0 / 0.35), 0 1px 4px rgb(0 0 0 / 0.25);
        }
      </style>
      ${shots.map((s) => `<img src="data:image/png;base64,${s.toString('base64')}" alt="">`).join('')}
    `;
    const card = await browser.newPage({ viewport: IMAGE, deviceScaleFactor: scale });
    await card.setContent(html);
    await card.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
    await card.screenshot({ path });
    console.log(`Wrote ${path} at ${scale}× (background ${background} from --pink ${pink})`);
  }
} finally {
  await browser?.close();
  await server.stop();
}

// These run in the page, on the scenario's paragraphs.
function scenarioLength() {
  return [...document.querySelectorAll('article p')].reduce((n, p) => n + p.textContent.trim().length, 0);
}

function setScenarioSize(size) {
  document.querySelectorAll('article p').forEach((p) => (p.style.fontSize = `${size}px`));
}

// How far the article ends between its top (0) and the button's top (1).
function scenarioFill() {
  const article = document.querySelector('article').getBoundingClientRect();
  return (article.bottom - article.top) / (document.querySelector('.cta').getBoundingClientRect().top - article.top);
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
