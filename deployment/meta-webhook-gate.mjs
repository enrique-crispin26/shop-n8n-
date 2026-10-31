import crypto from 'node:crypto';
import http from 'node:http';

const port = Number(process.env.PORT || 5680);
const appSecret = process.env.META_APP_SECRET;
const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://n8n:5678';
const maxBodyBytes = 1_000_000;

if (!appSecret) throw new Error('META_APP_SECRET no está configurado');

function send(response, status, message = '') {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(message);
}

function signatureIsValid(body, header) {
  if (typeof header !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  const received = header.slice('sha256='.length);
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

async function forward(request, response, body) {
  const target = new URL(request.url, n8nBaseUrl);
  const upstream = await fetch(target, {
    method: request.method,
    headers: {
      'content-type': request.headers['content-type'] || 'application/json',
      'content-length': String(body.length),
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : body,
  });
  const upstreamBody = await upstream.arrayBuffer();
  response.writeHead(upstream.status, {
    'content-type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
  });
  response.end(Buffer.from(upstreamBody));
}

http.createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path !== '/webhook/meta-whatsapp') return send(response, 404, 'Not found');

  if (request.method === 'GET') {
    return forward(request, response, Buffer.alloc(0)).catch(() => send(response, 502, 'Upstream unavailable'));
  }
  if (request.method !== 'POST') return send(response, 405, 'Method not allowed');

  const chunks = [];
  let size = 0;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxBodyBytes) request.destroy();
    else chunks.push(chunk);
  });
  request.on('error', () => send(response, 400, 'Invalid request'));
  request.on('end', () => {
    const body = Buffer.concat(chunks);
    if (size > maxBodyBytes) return send(response, 413, 'Payload too large');
    if (!signatureIsValid(body, request.headers['x-hub-signature-256'])) {
      return send(response, 401, 'Invalid Meta signature');
    }
    forward(request, response, body).catch(() => send(response, 502, 'Upstream unavailable'));
  });
}).listen(port, '0.0.0.0', () => console.log(`Meta webhook gate listening on port ${port}`));
