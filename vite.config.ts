
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
      'pdfjs-dist/build/pdf.worker.min.js'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
          'pdfjs-worker': ['pdfjs-dist/build/pdf.worker.min.js']
        }
      }
    }
  },
  // Enhanced worker support
  worker: {
    format: 'es',
    plugins: () => [react()]
  },
  // Define globals to prevent build issues
  define: {
    global: 'globalThis',
  }
}));
