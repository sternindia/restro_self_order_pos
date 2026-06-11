import { defineConfig, Plugin, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import crypto from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

let cachedCookie = '';

async function fetchWithBypass(
  url: string,
  method: string = 'GET',
  body: string | null = null,
  clientHeaders: Record<string, string | undefined> = {}
): Promise<{ status: number; headers: Headers; body: string }> {
  const headers: Record<string, string> = {
    'User-Agent': clientHeaders['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': clientHeaders['accept'] || '*/*',
    'Accept-Language': clientHeaders['accept-language'] || 'en-US,en;q=0.9',
  };

  if (cachedCookie) {
    headers['Cookie'] = `__test=${cachedCookie}`;
  }

  const fetchOptions: RequestInit = { method, headers };
  if (body) {
    fetchOptions.body = body;
    headers['Content-Type'] = clientHeaders['content-type'] || 'application/json';
  }

  let response = await fetch(url, fetchOptions);
  let responseText = await response.text();

  if (responseText.includes('toNumbers') && responseText.includes('slowAES.decrypt')) {
    console.log('[Bypass] Security challenge detected. Decrypting cookie...');
    const matches = [...responseText.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
    if (matches.length >= 3) {
      const keyHex = matches[0][1];
      const ivHex = matches[1][1];
      const ciphertextHex = matches[2][1];

      const key = Buffer.from(keyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const ciphertext = Buffer.from(ciphertextHex, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      decipher.setAutoPadding(false);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      cachedCookie = decrypted.toString('hex');
      console.log(`[Bypass] Automatically solved cookie: __test=${cachedCookie}`);

      headers['Cookie'] = `__test=${cachedCookie}`;
      response = await fetch(url, { method, headers, body });
      responseText = await response.text();
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    body: responseText
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-bypass-proxy',
      configureServer(server: ViteDevServer) {
        server.middlewares.use(async (req: IncomingMessage & { url?: string }, res: ServerResponse, next) => {
          const url = req.url || '';
          if (url.startsWith('/api')) {
            let reqBody: string | null = null;
            if (req.method === 'POST' || req.method === 'PUT') {
              reqBody = await new Promise<string>((resolve) => {
                let bodyStr = '';
                req.on('data', chunk => bodyStr += chunk);
                req.on('end', () => resolve(bodyStr));
              });
            }

            try {
              const targetUrl = `https://restroadmin.free.nf${url}`;
              const clientHeaders: Record<string, string | undefined> = {};
              for (const [k, v] of Object.entries(req.headers)) {
                clientHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
              }

              const result = await fetchWithBypass(targetUrl, req.method || 'GET', reqBody, clientHeaders);
              
              res.statusCode = result.status;
              result.headers.forEach((val, key) => {
                const lowerKey = key.toLowerCase();
                if (
                  lowerKey !== 'transfer-encoding' && 
                  lowerKey !== 'content-encoding' && 
                  lowerKey !== 'content-length'
                ) {
                  res.setHeader(key, val);
                }
              });
              
              if (result.body.startsWith('{') || result.body.startsWith('[')) {
                res.setHeader('content-type', 'application/json');
              }
              res.end(result.body);
            } catch (err: any) {
              console.error('[Proxy Error]:', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    } as Plugin
  ]
})
