
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker for React-PDF v9+ using simpler approach
export const configurePDFWorker = () => {
  try {
    // Use CDN version that matches the installed pdfjs version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    console.log('📄 PDF.js Worker configured with CDN version:', pdfjs.version);
    return true;
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
    return false;
  }
};

// Initialize worker configuration immediately
configurePDFWorker();
