import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    host: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '4174' },
  },
});
const port = Number(values.port);

if (!Number.isInteger(port) || port < 0 || port > 65_535) {
  throw new Error(`无效端口：${values.port}`);
}

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' });
    response.end('Method Not Allowed');
    return;
  }

  try {
    const requestUrl = new URL(request.url || '/', 'http://localhost');
    const pathname = requestUrl.pathname === '/' ? '/manifest.json' : requestUrl.pathname;
    const filePath = resolveDistFile(pathname);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('not-file');

    response.writeHead(200, {
      'Content-Type': contentType(filePath),
      'Content-Length': fileStat.size,
      'Cache-Control': pathname.endsWith('manifest.json')
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
  }
});

server.listen({ host: values.host, port }, () => {
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  console.log(`remote-material-example listening at http://${values.host}:${actualPort}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}

function resolveDistFile(pathname) {
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = path.resolve(distDirectory, relativePath);
  const distPrefix = `${path.resolve(distDirectory)}${path.sep}`;
  if (!filePath.startsWith(distPrefix)) {
    throw new Error('invalid-path');
  }
  return filePath;
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
}

function contentType(filePath) {
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  return 'application/octet-stream';
}
