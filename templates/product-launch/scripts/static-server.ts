/**
 * A tiny static server for the exported site in out/, so captures and previews need no extra
 * package. Serves `/x` from `x.html` or `x/index.html`, as a CDN does.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function resolveFile(root: string, url: string): string | null {
  const path = normalize(decodeURIComponent(url.split('?')[0] ?? '/')).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(root, path), join(root, `${path}.html`), join(root, path, 'index.html')];
  return candidates.find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
}

export function serveStatic(root: string, port = 0): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    const file = resolveFile(root, req.url ?? '/');
    if (file === null) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      const missing = resolveFile(root, '/404');
      if (missing === null) res.end('not found');
      else createReadStream(missing).pipe(res);
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const actual = typeof address === 'object' && address !== null ? address.port : port;
      resolve({ server, url: `http://127.0.0.1:${String(actual)}` });
    });
  });
}
