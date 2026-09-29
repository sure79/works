import { chromium } from 'playwright-core';
import fs from 'fs';
const [,, mode='test', ...rest] = process.argv;
const TL = JSON.parse(fs.readFileSync('timeline.json','utf8'));
const FPS = 30;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--allow-file-access-from-files'] });
async function worker(frames, dir) {
  const ctx = await browser.newContext({ viewport:{ width:1920, height:1080 }, deviceScaleFactor:1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  page.on('console', m => { if (m.type()==='error') console.error('CONSOLE', m.text()) });
  await page.goto('file://' + process.cwd() + '/compose.html');
  await page.evaluate(() => window.ready);
  for (const f of frames) {
    const t = f / FPS;
    await page.evaluate(t => window.seek(t), t);
    await page.screenshot({ path: `${dir}/f${String(f).padStart(5,'0')}.jpg`, type:'jpeg', quality:92 });
  }
  await ctx.close();
}
if (mode === 'test') {
  const times = rest.map(Number);
  fs.mkdirSync('../test', { recursive:true });
  const ctx = await browser.newContext({ viewport:{ width:1920, height:1080 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  page.on('console', m => { if (m.type()==='error') console.error('CONSOLE', m.text()) });
  await page.goto('file://' + process.cwd() + '/compose.html');
  await page.evaluate(() => window.ready);
  for (const t of times) { await page.evaluate(t => window.seek(t), t); await page.screenshot({ path:`../test/t${String(t).replace('.','_')}.png` }); }
} else {
  const N = Math.ceil(TL.total * FPS), dir = '../frames'; fs.mkdirSync(dir, { recursive:true });
  const W = 4, chunks = Array.from({ length:W }, () => []);
  for (let f = 0; f < N; f++) chunks[f % W].push(f);
  await Promise.all(chunks.map(c => worker(c, dir)));
  console.log('frames', N);
}
await browser.close();
