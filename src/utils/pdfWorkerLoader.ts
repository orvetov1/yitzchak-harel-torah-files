
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker with better error handling and fallback
export const configurePDFWorker = () => {
  try {
    // Try to use local worker first (more reliable)
    if (typeof window !== 'undefined') {
      // Use a more stable CDN with the exact version
      const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      
      console.log('📄 PDF.js Worker configured successfully:', {
        version: pdfjs.version,
        workerSrc: workerSrc
      });
      
      return true;
    }
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
    
    // Fallback configuration
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
      console.log('🔄 PDF.js Worker fallback configured');
      return true;
    } catch (fallbackError) {
      console.error('❌ PDF.js worker fallback also failed:', fallbackError);
      return false;
    }
  }
  
  return false;
};

// Test worker availability
export const testPDFWorker = async () => {
  try {
    // Simple test to see if worker is available
    const testDoc = await pdfjs.getDocument({ data: new Uint8Array([]) }).promise;
    console.log('✅ PDF Worker test successful');
    return true;
  } catch (error) {
    console.warn('⚠️ PDF Worker test failed:', error);
    return false;
  }
};

// Initialize worker configuration
const workerConfigured = configurePDFWorker();
if (!workerConfigured) {
  console.error('🚨 Failed to configure PDF.js worker - PDF functionality may not work');
}
