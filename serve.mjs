// Minimal zero-dependency static file server for the dist/ output.
// Serves correct MIME types for .html/.css/.js/.json/.csv/.png/.xml/.txt.
// Usage: node serve.mjs [port]  (default 8080)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.map': 'application/json; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    // Prevent path traversal
    let safe = normalize(urlPath).replace(/\\/g, '/');
    if (safe.includes('..')) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    let filePath = join(DIST, safe);
    let s = await stat(filePath).catch(() => null);
    if (s && s.isDirectory()) {
      filePath = join(filePath, 'index.html');
      s = await stat(filePath).catch(() => null);
    }
    if (!s) {
      // Try directory index fallback
      const idx = join(DIST, safe, 'index.html');
      const s2 = await stat(idx).catch(() => null);
      if (s2) { filePath = idx; s = s2; }
    }
    if (!s || !s.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><title>404</title><h1>404 Not Found</h1><p>The requested resource was not found.</p>');
      return;
    }
    const ext = extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=60'
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/`);
  console.log(`Serving: ${DIST}`);
});
