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
        target: process.env.VITE_API_BASE_URL || 'https://daino.onrender.com',
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
    sourcemap: false, // Disable sourcemaps to reduce bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging (TEMPORARY)
        drop_debugger: true,
        pure_funcs: [] // Keep all console methods for debugging
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'react-query': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react'],

          // Feature chunks - split by route
          'admin-features': [
            './src/pages/admin/Dashboard.jsx',
            './src/pages/admin/Products.jsx',
            './src/pages/admin/Orders.jsx',
            './src/pages/admin/Categories.jsx',
            './src/pages/admin/Attributes.jsx',
          ],
          'storefront-features': [
            './src/pages/storefront/ProductDetail.jsx',
            './src/pages/storefront/Category.jsx',
            './src/pages/storefront/Cart.jsx',
            './src/pages/storefront/Checkout.jsx',
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
  }
}) 