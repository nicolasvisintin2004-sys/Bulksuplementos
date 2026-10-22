#!/usr/bin/env node
/**
 * Exporta las piezas de Instagram de instagram/piezas/*.html a instagram/salida/<pieza>/.
 *   - Carruseles e imágenes: un PNG por cada <section class="slide"> (1080×1350).
 *   - Reels: un MP4 1080×1920 a 30 fps (sin audio; la música se elige al publicar).
 *   - descripcion.txt: el texto del <script id="descripcion"> de la pieza.
 * Uso: npm run instagram            (todas)
 *      npm run instagram -- mitos   (sólo las que contengan "mitos" en el nombre)
 * Usa el Chrome instalado. Si está en otra ruta: CHROME_PATH="C:/.../chrome.exe"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PIEZAS = path.join(ROOT, 'instagram/piezas');
const SALIDA = path.join(ROOT, 'instagram/salida');
const MUXER = path.join(ROOT, 'node_modules/mp4-muxer/build/mp4-muxer.js');
const FPS = 30;

const chrome = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('No encontré Chrome. Indicá la ruta con la variable CHROME_PATH.');
  process.exit(1);
}

const filtro = process.argv[2];
const archivos = fs.readdirSync(PIEZAS).filter((f) => f.endsWith('.html') && (!filtro || f.includes(filtro)));
if (!archivos.length) {
  console.error('No hay piezas que coincidan.');
  process.exit(1);
}

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--allow-file-access-from-files'] });

for (const archivo of archivos) {
  const nombre = archivo.replace(/\.html$/, '');
  const dir = path.join(SALIDA, nombre);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.goto(pathToFileURL(path.join(PIEZAS, archivo)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const descripcion = await page.evaluate(() => document.getElementById('descripcion')?.textContent.trim());
  if (descripcion) fs.writeFileSync(path.join(dir, 'descripcion.txt'), descripcion + '\n');

  const reel = await page.$('.reel');
  if (reel) {
    await exportarReel(page, reel, path.join(dir, `${nombre}.mp4`));
    await reel.screenshot({ path: path.join(dir, 'portada.png') }); // último cuadro, sirve de portada
    console.log(`✔ ${nombre}: MP4 + portada`);
  } else {
    const slides = await page.$$('.slide');
    for (const [i, slide] of slides.entries()) {
      await slide.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`) });
    }
    console.log(`✔ ${nombre}: ${slides.length} imagen(es)`);
  }
  await page.close();
}
await browser.close();
console.log(`Listo → ${path.relative(ROOT, SALIDA)}`);

/** Avanza la animación cuadro por cuadro y codifica H.264 dentro de Chrome (WebCodecs). */
async function exportarReel(page, reel, destino) {
  const duracion = Number(await reel.evaluate((el) => el.dataset.duracion));
  if (!duracion) throw new Error('El reel necesita data-duracion (segundos).');
  const total = Math.round(duracion * FPS);
  await page.addScriptTag({ path: MUXER });

  await page.evaluate(async (fps) => {
    const { Muxer, ArrayBufferTarget } = Mp4Muxer;
    const base = { width: 1080, height: 1920, bitrate: 10_000_000, framerate: fps };
    let config;
    for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42002a']) {
      if ((await VideoEncoder.isConfigSupported({ ...base, codec })).supported) { config = { ...base, codec }; break; }
    }
    if (!config) throw new Error('Este Chrome no puede codificar H.264.');
    const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: 1080, height: 1920, frameRate: fps }, fastStart: 'in-memory' });
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { window.__errorVideo = String(e); },
    });
    encoder.configure(config);
    window.__video = { muxer, encoder };
  }, FPS);

  for (let i = 0; i < total; i++) {
    await page.evaluate((ms) => window.irA(ms), (i * 1000) / FPS);
    const cuadro = await reel.screenshot({ type: 'jpeg', quality: 96, encoding: 'base64' });
    await page.evaluate(async (b64, i, fps) => {
      if (window.__errorVideo) throw new Error(window.__errorVideo);
      const bmp = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${b64}`)).blob());
      const frame = new VideoFrame(bmp, { timestamp: (i * 1e6) / fps, duration: 1e6 / fps });
      window.__video.encoder.encode(frame, { keyFrame: i % fps === 0 });
      frame.close();
      bmp.close();
    }, cuadro, i, FPS);
    if (i % FPS === 0) process.stdout.write(`\r  ${path.basename(destino)}: ${Math.round((i / total) * 100)}%`);
  }
  process.stdout.write('\r');

  const b64 = await page.evaluate(async () => {
    const { muxer, encoder } = window.__video;
    await encoder.flush();
    muxer.finalize();
    const bytes = new Uint8Array(muxer.target.buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  });
  fs.writeFileSync(destino, Buffer.from(b64, 'base64'));
}
