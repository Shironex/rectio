import { readFile } from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { join, normalize, sep } from 'node:path';

export interface ServeOptions {
  /** The built registry folder (dist/registry). */
  dir: string;
  /** Keys accepted for pro items. Empty: every pro request is refused. */
  licenseKeys: readonly string[];
  port?: number;
  host?: string;
}

export interface RunningRegistry {
  url: string;
  close: () => Promise<void>;
}

const send = (res: ServerResponse, status: number, body: string, type = 'application/json') => {
  res.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(body);
};

const errorBody = (message: string) => JSON.stringify({ error: message });

/**
 * A local registry for development: serves the static folder as the hosted registry will, and
 * gates `pro/` the way the license server will (401 without or with an unknown key). It is not
 * the license server: keys are a plain allow list, there are no seats or entitlements.
 */
export function serveRegistry({
  dir,
  licenseKeys,
  port = 0,
  host = '127.0.0.1',
}: ServeOptions): Promise<RunningRegistry> {
  const root = normalize(dir);
  const keys = new Set(licenseKeys);
  const server: Server = createServer((req, res) => {
    void (async () => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, errorBody('method not allowed'));
        return;
      }
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      const file = normalize(join(root, pathname));
      if (!file.startsWith(root + sep) || !file.endsWith('.json')) {
        send(res, 404, errorBody('not found'));
        return;
      }
      if (pathname.startsWith('/pro/')) {
        const header = req.headers.authorization ?? '';
        const key = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim();
        if (key === undefined || !keys.has(key)) {
          send(res, 401, errorBody('a valid license key is required for pro items'));
          return;
        }
      }
      try {
        send(res, 200, await readFile(file, 'utf8'));
      } catch {
        send(res, 404, errorBody('not found'));
      }
    })();
  });
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address !== null ? address.port : port;
      resolvePromise({
        url: `http://${host}:${actualPort}`,
        close: () =>
          new Promise<void>((done, fail) => {
            server.close((error) => {
              if (error === undefined) done();
              else fail(error);
            });
          }),
      });
    });
  });
}
