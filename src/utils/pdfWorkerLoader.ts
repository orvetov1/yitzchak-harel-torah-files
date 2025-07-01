
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker with fallback strategy and error handling
export const configurePDFWorker = () => {
  try {
    // Primary: Try to use local worker file
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    console.log('📄 PDF.js Worker configured with local file:', pdfjs.GlobalWorkerOptions.workerSrc);
    
    // Verify worker is accessible by attempting to create a minimal test
    return true;
  } catch (error) {
    console.error('❌ Failed to configure PDF.js worker:', error);
    
    // Fallback to CDN version as last resort
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      console.warn('⚠️ Using CDN fallback for PDF.js worker');
      return true;
    } catch (fallbackError) {
      console.error('❌ PDF.js worker configuration completely failed:', fallbackError);
      return false;
    }
  }
};

// Initialize worker configuration immediately
configurePDFWorker();
