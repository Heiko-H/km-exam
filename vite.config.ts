import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { encryptedDataPlugin } from './build/encrypt-plugin.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const password = process.env.APP_PASSWORD ?? env.APP_PASSWORD;

  return {
    base: '/km-exam/',
    plugins: [
      react(),
      tailwindcss(),
      encryptedDataPlugin(password, resolve(process.cwd(), 'data')),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-icon.svg'],
        pwaAssets: { config: true, overrideManifestIcons: true },
        manifest: {
          name: 'Krav-Maga Prüfungs-App',
          short_name: 'KM Prüfung',
          description: 'Prüfungs-App für Krav-Maga',
          lang: 'de',
          theme_color: '#192a3d',
          background_color: '#192a3d',
          display: 'standalone',
          start_url: '/km-exam/',
          scope: '/km-exam/',
          icons: [
            {
              src: '/km-exam/pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
  };
});