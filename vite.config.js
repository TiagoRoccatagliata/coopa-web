import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terminos: resolve(__dirname, 'terminos.html'),
        privacidad: resolve(__dirname, 'privacidad.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      },
    },
  },
});
