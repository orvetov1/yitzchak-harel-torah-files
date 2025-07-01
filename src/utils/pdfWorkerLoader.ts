
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker with fallback strategy
export const configurePDFWorker = () => {
  // Primary: Try to use local worker file
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  
  // Set additional options for better performance
  pdfjs.GlobalWorkerOptions.verbosity = 0;
  
  console.log('📄 PDF.js Worker configured with local file');
};

// Initialize worker configuration
configurePDFWorker();
