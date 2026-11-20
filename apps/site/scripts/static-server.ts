/**
 * A tiny static server for the exported site in out/ (and the live template previews in .previews/
 * during `pnpm dev`), so captures and previews need no extra package. Serves `/x` from `x.html` or
 * `x/index.html`, as a CDN does, and a missing page from the nearest `404.html` above it, so a
 * template's own not found page answers inside its preview.
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
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const isFile = (file: string) => existsSync(file) && statSync(file).isFile();

/** The request path, decoded, without the query and never above the root. */
const cleanPath = (url: string) =>
  normalize(decodeURIComponent(url.split('?')[0] ?? '/')).replace(/^(\.\.[/\\])+/, '');

function resolveFile(root: string, path: string): string | null {
  const candidates = [join(root, path), join(root, `${path}.html`), join(root, path, 'index.html')];
  return candidates.find(isFile) ?? null;
}

/** `/preview/x/missing` answers with `preview/x/404.html` when there is one, else `404.html`. */
function notFoundFile(root: string, path: string): string | null {
  const segments = path.split(/[/\\]/).filter(Boolean);
  for (let depth = segments.length; depth >= 0; depth -= 1) {
    const file = join(root, ...segments.slice(0, depth), '404.html');
    if (isFile(file)) return file;
  }
  return null;
}

/**
 * Serves `root` on 127.0.0.1. With `mount`, only requests under that path are served, from the
 * root without it: `/preview/x/` is `<root>/x/index.html` for the mount `/preview`.
 */
export function serveStatic(
  root: string,
  port = 0,
  mount = '',
): Promise<{ server: Server; url: string }> {
  const server = createServer((req, res) => {
    const url = req.url ?? '/';
    const mounted = mount === '' || url === mount || url.startsWith(`${mount}/`);
    const path = cleanPath(mounted ? url.slice(mount.length) || '/' : '/');
    const file = mounted ? resolveFile(root, path) : null;
    if (file === null) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      const missing = mounted ? notFoundFile(root, path) : null;
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
