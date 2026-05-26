import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SANDBOX = 'https://preview-sandbox--69e15ed21f38e4f0db4a345b.base44.app';
const TOKEN_FILE = path.join(os.tmpdir(), 'base44_dev_token.txt');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'token-sync',
      configureServer(server) {
        server.middlewares.use('/dev-token', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          if (req.method === 'OPTIONS') { res.end(); return; }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const { token } = JSON.parse(body);
                if (token) fs.writeFileSync(TOKEN_FILE, token, 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch { res.end(JSON.stringify({ ok: false })); }
            });
          } else {
            try {
              const token = fs.existsSync(TOKEN_FILE) ? fs.readFileSync(TOKEN_FILE, 'utf8').trim() : '';
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ token }));
            } catch { res.end(JSON.stringify({ token: '' })); }
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: SANDBOX,
        changeOrigin: true,
        secure: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Origin-URL', SANDBOX + '/');
            proxyReq.setHeader('Origin', SANDBOX);
            proxyReq.setHeader('Referer', SANDBOX + '/');
          });
        },
      },
    },
  },
});
