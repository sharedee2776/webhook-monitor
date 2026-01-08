import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api': 'http://localhost:7071', // Remove or update for production
    },
  },
  build: {
    // Optimize build output to reduce file count for Azure Static Web Apps
    sourcemap: false, // Disable source maps to reduce file count
    minify: 'esbuild', // Use esbuild (default, faster and no extra dependency)
    // Note: esbuild automatically removes console.log in production builds
    rollupOptions: {
      output: {
        // Optimize asset file names to reduce file count
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        // Limit chunk splitting to reduce total file count
        manualChunks(id) {
          // Group vendor dependencies together
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Group other node_modules into a single vendor chunk
            return 'vendor';
          }
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
})
