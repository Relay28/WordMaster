import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      threshold: 10240,
      deleteOriginFile: false, // Keep original files
      filter: /\.(js|css|html)$/i,
      filename: '[path][base].gz' // Fixes path issues
    }),
  ],
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer'],
    exclude: ['@firebase/util']
  },
  build: {
    chunkSizeWarningLimit: 1000, // Adjust warning threshold
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,          // Disable sourcemaps
    // Remove duplicate chunkSizeWarningLimit
  }
})