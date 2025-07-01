
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker with matching version to the installed pdfjs-dist
export const configurePDFWorker = () => {
  try {
    // Use the version that matches our installed pdfjs-dist@4.4.168
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
    console.log('📄 PDF.js Worker configured successfully with version 4.4.168');
    return true;
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
    return false;
  }
};

// Initialize worker configuration immediately
configurePDFWorker();

// Export pdfjs for use in components
export { pdfjs };
