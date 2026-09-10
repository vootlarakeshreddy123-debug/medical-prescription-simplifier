import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // Enable Hot Module Replacement unless explicitly disabled
      hmr: process.env.DISABLE_HMR !== 'true',

      // Prevent Vite from watching the .data folder.
      // The backend updates prescription_store.json after extraction.
      // Without ignoring this folder, Vite may reload the entire page
      // and send the user back to the Dashboard.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
            ignored: ['**/.data/**'],
          },
    },
  };
});