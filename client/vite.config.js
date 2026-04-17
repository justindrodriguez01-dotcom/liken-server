import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    outDir: resolve(__dirname, '../server/public/app'),
    emptyOutDir: true,
  },
})
