
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker for React-PDF v9+
export const configurePDFWorker = () => {
  try {
    // Use CDN version that matches the installed pdfjs version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    console.log('📄 PDF.js Worker configured successfully with version:', pdfjs.version);
    return true;
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
    // Fallback to local worker if CDN fails
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      console.log('📄 PDF.js Worker configured with local fallback');
      return true;
    } catch (fallbackError) {
      console.error('❌ PDF.js worker fallback also failed:', fallbackError);
      return false;
    }
  }
};

// Initialize worker configuration immediately
configurePDFWorker();

// Export pdfjs for use in components
export { pdfjs };
