import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(rootDir, 'index.html'),
          home: resolve(rootDir, 'home.html'),
          contacts: resolve(rootDir, 'contacts.html'),
          profile: resolve(rootDir, 'profile.html'),
          register: resolve(rootDir, 'register.html'),
          terms: resolve(rootDir, 'terms-and-conditions.html'),
        },
      },
    },
  };
});
