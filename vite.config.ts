import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

// vite-plugin-singlefile requires single-entry builds.
// The build script runs vite build once per widget using WIDGET env var.
const widget = process.env.WIDGET || 'detection-result';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: resolve(__dirname, 'ui/widgets'),
  build: {
    outDir: resolve(__dirname, 'dist-ui'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'ui/widgets', `${widget}.html`),
    },
  },
  resolve: {
    alias: {
      '@ui': resolve(__dirname, 'ui/src'),
    },
  },
});
