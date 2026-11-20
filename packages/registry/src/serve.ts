import { readFile } from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { join, normalize, sep } from 'node:path';

export interface ServeOptions {
  /** The built registry folder (dist/registry). */
  dir: string;
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
 * A local registry for development: serves the static folder as the hosted registry does, a plain
 * static server for the `.json` files under `dir`.
 */
export function serveRegistry({
  dir,
  port = 0,
  host = '127.0.0.1',
}: ServeOptions): Promise<RunningRegistry> {
  const root = normalize(dir);
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
