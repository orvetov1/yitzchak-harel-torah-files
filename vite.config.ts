
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Enhanced PDF.js configuration for production
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'react-pdf'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist', 'react-pdf']
        }
      }
    },
    // Ensure public assets are copied correctly
    assetsDir: 'assets',
    copyPublicDir: true
  },
  // Ensure public directory files are served correctly
  publicDir: 'public',
  // Define globals to prevent build issues
  define: {
    global: 'globalThis',
  }
}));
