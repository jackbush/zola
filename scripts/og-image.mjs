// Regenerates public/og-image.png: two pages captured at phone size in dark
// mode on the 1200×630 social preview. A scenario on the left runs off the top,
// cropped below its nav; the about page on the right runs off the bottom. Run with `npm run og` (builds the site first). Uses the installed Chrome.
// `npm run og -- --cover <path>` also writes a 2× copy to <path>, for sites
// that show it larger than a social preview.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { build, preview } from 'astro';
import { chromium } from 'playwright-core';

const LEFT_PAGE = 'scenarios/epilepsy/';
const RIGHT_PAGE = 'about/';
const OUT = new URL('../public/og-image.png', import.meta.url);
const { cover } = parseArgs({ options: { cover: { type: 'string' } } }).values;
const outputs = [{ path: OUT.pathname, scale: 1 }];
if (cover) outputs.push({ path: resolve(process.env.INIT_CWD ?? '.', cover), scale: 2 });

const IMAGE = { width: 1200, height: 630 };
const PHONE = { width: 360, height: 780 };
// The phones fill the space between these side margins, GAP apart; the right
// one takes whatever width the left leaves. The left one's bottom and the right
// one's top are EDGE in from the frame.
const MARGIN = 186;
const GAP = 44;
const LEFT_WIDTH = 300;
const EDGE = 36;
// Drops the about page a little further, so no tops of letters peek in at the bottom
const RIGHT_NUDGE = 4;
// On phones the site sits the button on the browser's toolbar, which the
// preview doesn't have, so it's lifted off the bottom by the side gutter
const PREVIEW_CSS = `.cta__wrapper { padding-bottom: var(--gutter); }`;

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
  const built = await readFile(new URL(`../dist/${LEFT_PAGE}index.html`, import.meta.url), 'utf8');
  const served = await (await fetch(`${origin}${base}${LEFT_PAGE}`)).text();
  if (served !== built) throw new Error(`${origin} is not serving this build`);

  browser = await chromium.launch({ channel: 'chrome' });
  // Each phone is captured at the pixel density it's shown at in the card, so
  // the text is rasterised at its final size instead of being scaled down.
  const capture = async (path, width) => {
    const page = await browser.newPage({ viewport: PHONE, deviceScaleFactor: width / PHONE.width, colorScheme: 'dark' });
    const res = await page.goto(`${origin}${base}${path}`, { waitUntil: 'networkidle' });
    if (!res.ok()) throw new Error(`${path}: HTTP ${res.status()}`);
    await page.addStyleTag({ content: PREVIEW_CSS });
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot();
    await page.close();
    return shot;
  };

  const heightOf = (width) => (width * PHONE.height) / PHONE.width;
  const left = { page: LEFT_PAGE, x: MARGIN, y: IMAGE.height - EDGE - heightOf(LEFT_WIDTH), width: LEFT_WIDTH };
  const rightX = MARGIN + LEFT_WIDTH + GAP;
  const right = { page: RIGHT_PAGE, x: rightX, y: EDGE + RIGHT_NUDGE, width: IMAGE.width - MARGIN - rightX };

  for (const { path, scale } of outputs) {
    const imgs = [];
    for (const { page, x, y, width } of [left, right]) {
      const shot = await capture(page, Math.round(width * scale));
      imgs.push(
        `<img style="left:${x}px; top:${y}px; width:${width}px; height:${heightOf(width)}px"
          src="data:image/png;base64,${shot.toString('base64')}" alt="">`,
      );
    }
    const html = `
      <style>
        body {
          margin: 0;
          width: ${IMAGE.width}px;
          height: ${IMAGE.height}px;
          overflow: hidden;
          position: relative;
          background: ${background};
        }
        img {
          position: absolute;
          border-radius: 22px;
          box-shadow: 0 6px 20px rgb(0 0 0 / 0.35), 0 1px 4px rgb(0 0 0 / 0.25);
        }
      </style>
      ${imgs.join('')}
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
