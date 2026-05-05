#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const svgPath = join(projectRoot, 'public', 'og-image.svg');
const pngPath = join(projectRoot, 'public', 'og-image.png');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

try {
  await page.goto(pathToFileURL(svgPath).href, { waitUntil: 'load' });
  await mkdir(dirname(pngPath), { recursive: true });
  await page.screenshot({ path: pngPath, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(`[generate:og] Wrote ${pngPath.replace(`${projectRoot}/`, '')}`);
} finally {
  await browser.close().catch(() => {});
}
