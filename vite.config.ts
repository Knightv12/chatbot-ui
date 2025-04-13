import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8501,
    watch: {
      usePolling: false,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    },
    cors: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  // 禁用 TypeScript 檢查和優化生產構建
  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: {
        compilerOptions: {
          skipLibCheck: true,
          skipDefaultLibCheck: true,
          noImplicitAny: false,
          noUnusedLocals: false,
          noUnusedParameters: false
        }
      }
    }
  },
  build: {
    // 禁用類型檢查，提高構建速度
    sourcemap: false,
    minify: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})
