import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';
import { apiRouter } from './src/server/routes';
import { initDatabase } from './src/server/db';
import { setupChatWebSocket } from './src/server/chatServer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Initialize secure database on startup
  initDatabase();

  // Ensure uploads directory exists
  const uploadsPath = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Defensive Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Body parser with size limits configured for media uploads (up to 30mb for image/video)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Serve static uploads
  app.use('/uploads', express.static(uploadsPath));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint (for Cloud Run and monitoring)
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
    // When run directly as bundled dist/server.js: index.html is located in __dirname
    // When run from root via server.js or tsx: index.html is in path.resolve(__dirname, 'dist')
    const distPath = fs.existsSync(path.resolve(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(__dirname, 'dist');

    if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn(`[Server] Built client not found at ${distPath}. Please run "npm run build".`);
    }
  }

  const httpServer = http.createServer(app);

  // Attach real-time WebSocket chat server
  setupChatWebSocket(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fortaleza] Server successfully running at http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });

  // Graceful shutdown handling for Cloud Run container lifecycle
  const shutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      console.log('[Server] HTTP and WebSocket servers closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Server] Forceful shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
