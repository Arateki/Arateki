#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');

const PORT = process.env.PRERENDER_PORT ? Number(process.env.PRERENDER_PORT) : await findAvailablePort();
const BASE = `http://localhost:${PORT}`;

const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'];
const DEFAULT_ROOT_LANG = 'pt';
const PUBLIC_PATHS = ['', '/sales'];

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          reject(new Error('Unable to allocate a prerender preview port'));
        }
      });
    });
  });
}

function buildRoutes(productIds = []) {
  const routes = [];

  for (const lang of SUPPORTED_LANGS) {
    for (const path of PUBLIC_PATHS) {
      const route = `/${lang}${path}`;
      routes.push({ source: route, output: route, label: route });
    }

    for (const productId of productIds) {
      const route = `/${lang}/sales/${encodeURIComponent(productId)}`;
      routes.push({ source: route, output: route, label: route });
    }
  }

  routes.push({ source: `/${DEFAULT_ROOT_LANG}`, output: '/', label: '/' });
  return routes;
}

async function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'],
      {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let resolved = false;
    let output = '';
    const onData = (chunk) => {
      const line = chunk.toString();
      output += line;
      if (!resolved && (line.includes('Local:') || line.includes(`localhost:${PORT}`))) {
        resolved = true;
        resolve(child);
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (!resolved) reject(new Error(`vite preview exited with code ${code}\n${output}`));
    });

    setTimeout(() => {
      if (!resolved) reject(new Error(`Preview server failed to start within 15s\n${output}`));
    }, 15000);
  });
}

async function fetchProductsFromApi() {
  const apiBase = process.env.PRERENDER_API_BASE?.replace(/\/+$/, '');
  if (!apiBase) return null;

  try {
    const entries = await Promise.all(SUPPORTED_LANGS.map(async (lang) => {
      const res = await fetch(`${apiBase}/api/products?lang=${lang}&country=BR`);
      if (!res.ok) throw new Error(`Products API returned ${res.status} for lang=${lang}`);
      const json = await res.json();
      return [lang, json.products ?? []];
    }));

    return Object.fromEntries(entries);
  } catch {
    return null;
  }
}

function getProductIds(productsByLang) {
  if (!productsByLang) return [];
  const products = productsByLang[DEFAULT_ROOT_LANG] ?? [];
  return products
    .map(product => product.id)
    .filter((id, index, all) => typeof id === 'string' && id.length > 0 && all.indexOf(id) === index);
}

async function prerender(context, route) {
  const page = await context.newPage();
  // Wait for React 19 hydration + metadata hoisting to settle. Static head
  // metadata lives in <Seo>, so the generated snapshots have one source.
  try {
    await page.goto(`${BASE}${route.source}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(200);

    const html = await page.content();

    // Save with extension-based filename so static servers serve correctly
    const sanitized = route.output.replace(/^\//, '').replace(/\/$/, '');
    const outPath = join(distDir, sanitized, 'index.html');
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, 'utf8');

    return outPath;
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  console.log('[prerender] Starting Vite preview...');
  const server = await startPreviewServer();
  console.log(`[prerender] Preview running on ${BASE}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    const productsByLang = await fetchProductsFromApi();
    const productIds = getProductIds(productsByLang);
    if (productsByLang) {
      console.log(`[prerender] Will mock ${productIds.length} products from API.`);
    } else {
      console.log('[prerender] No API available; using empty product list.');
    }

    await context.route('**/api/products*', async (routeReq) => {
      const url = new URL(routeReq.request().url());
      const requestedLang = url.searchParams.get('lang');
      const lang = SUPPORTED_LANGS.includes(requestedLang) ? requestedLang : DEFAULT_ROOT_LANG;

      await routeReq.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: productsByLang?.[lang] ?? [] }),
      });
    });

    const routes = buildRoutes(productIds);
    for (const route of routes) {
      const out = await prerender(context, route);
      console.log(`[prerender]   ${route.label}  →  ${out.replace(projectRoot + '/', '')}`);
    }

    console.log(`[prerender] Done. Snapshotted ${routes.length} routes.`);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    server.kill('SIGKILL');
    setTimeout(() => process.exit(0), 1000).unref();
  }
}

main().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});
