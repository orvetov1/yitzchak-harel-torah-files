
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker for React-PDF v9+ using modern ES Module import
export const configurePDFWorker = () => {
  try {
    // Use dynamic import with ?url to get the worker URL for Vite/modern bundlers
    import('pdfjs-dist/build/pdf.worker.min.js?url').then((workerModule) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
      console.log('📄 PDF.js Worker configured with modern ES Module import');
    }).catch((error) => {
      console.error('❌ Failed to load PDF worker via ES Module:', error);
      // Fallback to CDN version as last resort
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      console.warn('⚠️ Using CDN fallback for PDF.js worker');
    });
    
    return true;
  } catch (error) {
    console.error('❌ PDF.js worker configuration completely failed:', error);
    return false;
  }
};

// Initialize worker configuration immediately
configurePDFWorker();
