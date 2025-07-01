
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
  // Optimize for PDF.js worker loading with React-PDF v9+
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'pdfjs-dist/build/pdf.worker.min.js'
    ],
    exclude: []
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist']
        }
      }
    }
  },
  // Ensure worker files are properly served and support ES modules
  assetsInclude: ['**/*.worker.js', '**/*.worker.min.js'],
  // Modern worker handling for React-PDF v9+
  worker: {
    format: 'es'
  },
  // Define globals to prevent build issues
  define: {
    global: 'globalThis',
  }
}));
