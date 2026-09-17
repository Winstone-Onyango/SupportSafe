import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port so the SupportSafe Next.js app can embed this app reliably.
  // `host: true` binds IPv4 + IPv6 so the iframe connects regardless of how
  // the browser resolves localhost.
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})
