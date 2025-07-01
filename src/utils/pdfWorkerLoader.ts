
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker with a stable version
export const configurePDFWorker = () => {
  try {
    // Use a specific stable version of PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    console.log('📄 PDF.js Worker configured successfully with stable version 3.11.174');
    return true;
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
    return false;
  }
};

// Initialize worker configuration
const initResult = configurePDFWorker();
if (!initResult) {
  console.warn('⚠️ PDF.js worker failed to initialize, PDF viewing may not work');
}

// Export pdfjs for use in components
export { pdfjs };
