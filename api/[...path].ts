import type { Request, Response } from 'express';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { app, appReady } = require('../dist/server.cjs');

export default async function handler(req: Request, res: Response) {
  try {
    await appReady;

    // Make sure Express receives the original Vercel API path.
    if (req.url && !req.url.startsWith('/api/')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }

    console.log('[Vercel API]', req.method, req.url);

    return app(req, res);
  } catch (error) {
    console.error('[Vercel API] Initialization error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_INITIALIZATION_FAILED',
          message: 'The server could not be initialized.',
        },
      });
    }
  }
}
