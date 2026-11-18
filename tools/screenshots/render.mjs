// Renders the documentation images in docs/ from dist/bms-battery-cells-card-jkbms.js.
// Run after every card change:  npm run screenshots
// Needs: npm i -D esbuild lit @mdi/js playwright-core, and Google Chrome / Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { buildStates } from './data.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.join(here, '.build');
fs.mkdirSync(out, { recursive: true });

await build({ entryPoints: [path.join(here, 'harness.js')], bundle: true, format: 'esm', outfile: path.join(out, 'harness.js'), external: ['./card.js'], logLevel: 'error' });
fs.copyFileSync(path.join(root, 'dist/bms-battery-cells-card-jkbms.js'), path.join(out, 'card.js'));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { --primary-text-color:#212121; --rgb-primary-text-color:33,33,33; --secondary-text-color:#727272;
          --card-background-color:#fff; --divider-color:#e0e0e0; --primary-color:#03a9f4;
          --paper-font-body1_-_font-family:Roboto,sans-serif; }
  body { margin:0; padding:16px; background:#fafafa; font-family:Roboto,sans-serif; }
  #grid { display:inline-grid; gap:16px; align-items:start; }
</style>
<script type="module" src="harness.js"></script></head><body><div id="grid"></div></body></html>`);

const server = http.createServer((req, res) => {
  const f = path.join(out, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(out) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const exe = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe });

const detail = (p, title) => ({ jk_prefix: p, title, show_detailed_view: true, show_status: true, balance_led: true, show_title_in_detail: true, show_charts: true });
const compact = (p, title) => ({ jk_prefix: p, title, show_as_table: true });
const shots = [
  { file: 'jk-dashboard.png', columns: 3, width: 500, states: buildStates(),
    cards: [detail('bms_master', 'Master BMS (JK)'), detail('bms_1', 'BMS 1 (JK)'), detail('bms_2', 'BMS 2 (JK)'),
            compact('bms_master', 'Master BMS (JK)'), compact('bms_1', 'BMS 1 (JK)'), compact('bms_2', 'BMS 2 (JK)')] },
  { file: 'jk-detailansicht.png', states: buildStates(), cards: [detail('bms_master', 'Master BMS (JK)')] },
  { file: 'jk-alarm.png', states: buildStates({ alarmOn: 'bms_1', protectionOn: 'bms_1' }), cards: [detail('bms_1', 'BMS 1 (JK)')] },
  { file: 'jk-einstellungen.png', states: buildStates(), cards: [{ ...detail('bms_master', 'Master BMS (JK)'), show_charts: false, jk_settings_open: true }] },
  { file: 'jk-kompakt.png', states: buildStates(), cards: [compact('bms_master', 'Master BMS (JK)')] },
];

for (const s of shots) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1640, height: 900 } });
  page.on('pageerror', e => { if (!/getContext|createLinearGradient/.test(String(e))) console.error(s.file, e); });
  await page.goto(url);
  await page.waitForFunction(() => window.renderCards);
  await page.evaluate((a) => window.renderCards(a), { cards: s.cards, states: s.states, columns: s.columns || 1, width: s.width || 500 });
  await page.locator('#grid').screenshot({ path: path.join(root, 'docs', s.file) });
  console.log('docs/' + s.file);
  await page.close();
}
await browser.close();
server.close();
