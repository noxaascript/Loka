import { createServer } from 'http';
import { URL } from 'url';
import { randomBytes, createHash } from 'crypto';

export function createCallbackServer(port = 1455, path = '/auth/callback') {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:' + port);
      if (url.pathname !== path) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (error) {
        res.end('<h1>Gagal</h1><p>Tutup jendela ini.</p>');
        if (!resolved) { resolved = true; reject(new Error(error)); }
      } else if (code) {
        res.end('<h1>Berhasil!</h1><p>Tutup jendela ini dan balik ke Loka.</p>');
        if (!resolved) { resolved = true; resolve({ code }); }
      } else {
        res.end('<h1>Menunggu...</h1>');
      }
      setTimeout(() => server.close(), 500);
    });
    server.listen(port, '127.0.0.1', () => {

    });
    server.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(new Error(err.code === 'EADDRINUSE' ? 'Port ' + port + ' sedang dipakai' : err.message));
      }
    });
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.close();
        reject(new Error('Timeout nunggu callback'));
      }
    }, 300000);
  });
}

export function parseCallbackUrl(rawUrl) {
  try {
    const url = new URL(rawUrl.trim());
    const code = url.searchParams.get('code');
    if (!code) throw new Error('URL tidak punya parameter code');
    return { code };
  } catch (e) {
    throw new Error('URL tidak valid: ' + e.message);
  }
}

export function pkceVerifier() {
  return randomBytes(32).toString('base64url');
}

export function pkceChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url');
}
