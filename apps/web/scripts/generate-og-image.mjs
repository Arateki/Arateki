#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import TextToSVG from 'text-to-svg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const fontsDir = join(projectRoot, 'src', 'assets', 'fonts');
const svgPath = join(projectRoot, 'public', 'og-image.svg');
const pngPath = join(projectRoot, 'public', 'og-image.png');

const SVG_NS = 'http://www.w3.org/2000/svg';

const fontByWeight = {
  300: TextToSVG.loadSync(join(fontsDir, 'Montserrat-Light.ttf')),
  400: TextToSVG.loadSync(join(fontsDir, 'Montserrat-Regular.ttf')),
  500: TextToSVG.loadSync(join(fontsDir, 'Montserrat-Medium.ttf')),
  700: TextToSVG.loadSync(join(fontsDir, 'Montserrat-Bold.ttf')),
};

function pickFont(weight) {
  const w = Number(weight) || 400;
  if (w >= 700) return fontByWeight[700];
  if (w >= 500) return fontByWeight[500];
  if (w >= 400) return fontByWeight[400];
  return fontByWeight[300];
}

function readNum(el, attr, fallback = 0) {
  const v = el.getAttribute(attr);
  return v == null || v === '' ? fallback : Number(v);
}

function readStr(el, attr, fallback) {
  const v = el.getAttribute(attr);
  return v == null ? fallback : v;
}

function buildPathD(content, { x, y, fontSize, fontWeight, letterSpacingPx }) {
  const font = pickFont(fontWeight);
  return font.getD(content, {
    x,
    y,
    fontSize,
    letterSpacing: letterSpacingPx / fontSize,
    anchor: 'left baseline',
  });
}

function setAttrs(el, attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null && v !== '') el.setAttribute(k, String(v));
  }
}

function inheritedFromText(textEl, attr) {
  const v = textEl.getAttribute(attr);
  return v == null ? null : v;
}

function replaceTextWithPaths(textEl, doc) {
  const baseX = readNum(textEl, 'x', 0);
  const baseY = readNum(textEl, 'y', 0);
  const baseFontSize = readNum(textEl, 'font-size', 16);
  const baseFontWeight = readStr(textEl, 'font-weight', '400');
  const baseLetterSpacing = readNum(textEl, 'letter-spacing', 0);
  const fill = readStr(textEl, 'fill', '#000');
  const opacity = inheritedFromText(textEl, 'opacity');

  const tspans = Array.from(textEl.getElementsByTagNameNS(SVG_NS, 'tspan'));

  const wrapper = doc.createElementNS(SVG_NS, 'g');
  setAttrs(wrapper, { fill, opacity });

  if (tspans.length === 0) {
    const content = textEl.textContent.trim();
    if (content) {
      const d = buildPathD(content, {
        x: baseX,
        y: baseY,
        fontSize: baseFontSize,
        fontWeight: baseFontWeight,
        letterSpacingPx: baseLetterSpacing,
      });
      const path = doc.createElementNS(SVG_NS, 'path');
      setAttrs(path, { d });
      wrapper.appendChild(path);
    }
  } else {
    for (const tspan of tspans) {
      const content = tspan.textContent.trim();
      if (!content) continue;
      const x = readNum(tspan, 'x', baseX);
      const y = readNum(tspan, 'y', baseY);
      const fontSize = tspan.hasAttribute('font-size') ? readNum(tspan, 'font-size') : baseFontSize;
      const fontWeight = readStr(tspan, 'font-weight', baseFontWeight);
      const letterSpacingPx = tspan.hasAttribute('letter-spacing')
        ? readNum(tspan, 'letter-spacing')
        : baseLetterSpacing;
      const d = buildPathD(content, { x, y, fontSize, fontWeight, letterSpacingPx });
      const path = doc.createElementNS(SVG_NS, 'path');
      setAttrs(path, { d });
      wrapper.appendChild(path);
    }
  }

  textEl.parentNode.replaceChild(wrapper, textEl);
}

async function resolveTextsToSvg(svgString) {
  const dom = new JSDOM(svgString, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  const texts = Array.from(doc.getElementsByTagNameNS(SVG_NS, 'text'));
  for (const textEl of texts) replaceTextWithPaths(textEl, doc);
  return dom.serialize();
}

async function renderToPng(resolvedSvg) {
  const tmpUrl = `data:image/svg+xml;base64,${Buffer.from(resolvedSvg).toString('base64')}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });
    await page.goto(tmpUrl, { waitUntil: 'load' });
    await mkdir(dirname(pngPath), { recursive: true });
    await page.screenshot({
      path: pngPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
  } finally {
    await browser.close().catch(() => {});
  }
}

const svgRaw = await readFile(svgPath, 'utf8');
const resolved = await resolveTextsToSvg(svgRaw);
await renderToPng(resolved);
console.log(`[generate:og] Wrote ${pngPath.replace(`${projectRoot}/`, '')}`);
