import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes';
import { initDatabase } from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Initialize secure database on startup
  initDatabase();

  // Defensive Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Body parser with strict size limits to prevent Denial of Service
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'iPhone-Invest Financial Engine', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // HMR disabled per environment constraints
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static assets
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('[Server] dist directory not found. Please run "npm run build".');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fortaleza] Server successfully running at http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
