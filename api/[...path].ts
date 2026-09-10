import type { Request, Response } from 'express';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { app, appReady } = require('../dist/server.cjs');

export default async function handler(req: Request, res: Response) {
  try {
    await appReady;
    app(req, res);
  } catch (error) {
    console.error('Vercel API initialization error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_INITIALIZATION_FAILED',
          message: 'The server could not be initialized.',
        },
      });
    }
  }
}
