import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { builtinModules } from 'node:module'
import pkg from './package.json' with { type: 'json' }

const external = [
  'electron',
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
  ...Object.keys(pkg.dependencies || {}),
]

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external,
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            rollupOptions: {
              external,
            },
          },
        },
      },
    }),
  ],
})
