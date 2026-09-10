import type { Request, Response } from 'express';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { app, appReady } = require('../dist/server.cjs');

export default async function handler(req: Request, res: Response) {
  try {
    await appReady;

    console.log(
      '[Vercel API]',
      req.method,
      req.url,
      req.originalUrl
    );

    return app(req, res);
  } catch (error) {
    console.error('[Vercel API] Error:', error);

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
