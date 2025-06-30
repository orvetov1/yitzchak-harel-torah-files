
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync } from "fs";

// Plugin to copy PDF.js worker
const copyPdfWorker = () => ({
  name: 'copy-pdf-worker',
  buildStart() {
    const workerSrc = 'node_modules/pdfjs-dist/build/pdf.worker.min.js';
    const workerDest = 'public/pdf.worker.min.js';
    
    if (existsSync(workerSrc)) {
      copyFileSync(workerSrc, workerDest);
      console.log('✓ PDF.js worker copied to public directory');
    } else {
      console.warn('⚠ PDF.js worker not found at', workerSrc);
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    copyPdfWorker(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
