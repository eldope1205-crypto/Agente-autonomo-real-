import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * El entorno utiliza el puerto 3000.
 * También permitimos --port si el entorno lo proporciona.
 */
function resolvePort(): number {
  const portIndex =
    process.argv.indexOf('--port');

  if (
    portIndex !== -1 &&
    process.argv[portIndex + 1]
  ) {
    const requestedPort = Number(
      process.argv[portIndex + 1]
    );

    if (
      Number.isInteger(requestedPort) &&
      requestedPort > 0 &&
      requestedPort <= 65535
    ) {
      return requestedPort;
    }
  }

  return 3000;
}

const port = resolvePort();
const isProd =
  process.env.NODE_ENV === 'production';

/**
 * JSON y formularios.
 */
app.use(
  express.json({
    limit: '5mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '5mb',
  })
);

/**
 * Cabeceras básicas de seguridad.
 */
app.disable('x-powered-by');

/**
 * API principal.
 */
app.use('/api', apiRouter);

/**
 * Archivos de evidencia generados por el agente.
 *
 * Estos archivos son resultados/deliverables locales.
 */
app.use(
  '/data/evidence',
  express.static(
    path.resolve(
      __dirname,
      'data/evidence'
    )
  )
);

async function startServer(): Promise<void> {
  if (!isProd) {
    /**
     * Desarrollo:
     * Vite sirve la interfaz web.
     */
    const { createServer } =
      await import('vite');

    const vite =
      await createServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null,
        },
        appType: 'spa',
      });

    app.use(vite.middlewares);
  } else {
    /**
     * Producción:
     * sirve los archivos construidos
     * de la aplicación.
     */
    const distPath =
      path.resolve(
        __dirname,
        'dist'
      );

    app.use(
      express.static(distPath)
    );

    app.get('*', (_req, res) => {
      res.sendFile(
        path.join(
          distPath,
          'index.html'
        )
      );
    });
  }

  app.listen(
    port,
    '0.0.0.0',
    () => {
      console.log(
        `[Agente Autónomo] Servidor iniciado en puerto ${port}.`
      );

      console.log(
        '[Agente Autónomo] Motor local autónomo activo.'
      );

      console.log(
        '[Agente Autónomo] Principio de realidad financiera activo.'
      );

      console.log(
        '[Agente Autónomo] No se consideran ingresos no confirmados como dinero disponible.'
      );
    }
  );
}

startServer().catch(
  (error: unknown) => {
    console.error(
      '[Agente Autónomo] Error fatal al iniciar el servidor:',
      error
    );

    process.exit(1);
  }
);
