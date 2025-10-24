import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    sourcemap: true, // Enable source maps for production debugging
    minify: 'terser', // Use terser for better control over minification
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs in production for debugging
        drop_debugger: false // Keep debugger statements for now
      },
      mangle: {
        keep_fnames: true, // Keep function names for better error messages
      }
    }
  }
}) 