import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse CLI port arguments or default strictly to 3000 (environment constraint: dev server must run on 3000)
function resolvePort(): number {
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    return parseInt(process.argv[portIndex + 1], 10);
  }
  // In dev environment, port 3000 is required by the container reverse proxy
  return 3000;
}

const port = resolvePort();
const isProd = process.env.NODE_ENV === 'production';

// Express body parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Mount REST API
app.use('/api', apiRouter);

// Serve static evidence downloads
app.use('/data/evidence', express.static(path.resolve(__dirname, 'data/evidence')));

async function startServer() {
  if (!isProd) {
    // In dev mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // In production, serve built dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Agente Autónomo] Servidor full-stack iniciado en http://0.0.0.0:${port}`);
    console.log(`[Agente Autónomo] Principio de Realidad ACTIVO: Sin datos falsos.`);
  });
}

startServer().catch((err) => {
  console.error('[Agente Autónomo] Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
