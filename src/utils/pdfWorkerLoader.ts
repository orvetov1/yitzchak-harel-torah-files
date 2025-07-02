
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker with multiple fallback options
export const configurePDFWorker = () => {
  try {
    if (typeof window !== 'undefined') {
      // Primary: Use jsdelivr CDN (more reliable than unpkg)
      const primaryWorkerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      pdfjs.GlobalWorkerOptions.workerSrc = primaryWorkerSrc;
      
      console.log('📄 PDF.js Worker configured successfully:', {
        version: pdfjs.version,
        workerSrc: primaryWorkerSrc
      });
      
      return true;
    }
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
    
    // Fallback 1: Try cdnjs
    try {
      const fallback1 = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      pdfjs.GlobalWorkerOptions.workerSrc = fallback1;
      console.log('🔄 PDF.js Worker fallback 1 configured:', fallback1);
      return true;
    } catch (fallbackError1) {
      console.error('❌ PDF.js worker fallback 1 failed:', fallbackError1);
      
      // Fallback 2: Try unpkg without .min
      try {
        const fallback2 = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.js`;
        pdfjs.GlobalWorkerOptions.workerSrc = fallback2;
        console.log('🔄 PDF.js Worker fallback 2 configured:', fallback2);
        return true;
      } catch (fallbackError2) {
        console.error('❌ All PDF.js worker configurations failed');
        return false;
      }
    }
  }
  
  return false;
};

// Test worker availability with timeout
export const testPDFWorker = async (timeoutMs = 5000) => {
  try {
    console.log('🧪 Testing PDF Worker availability...');
    
    // Create a simple test promise with timeout
    const testPromise = new Promise((resolve, reject) => {
      try {
        // Try to create a simple PDF document to test worker
        const testData = new Uint8Array([
          0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
          0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, // header
          0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a // more header
        ]);
        
        pdfjs.getDocument({ data: testData }).promise
          .then(() => {
            console.log('✅ PDF Worker test successful');
            resolve(true);
          })
          .catch((error) => {
            console.warn('⚠️ PDF Worker test failed:', error);
            resolve(false);
          });
      } catch (error) {
        console.warn('⚠️ PDF Worker test setup failed:', error);
        resolve(false);
      }
    });
    
    // Add timeout
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        console.warn('⏰ PDF Worker test timed out');
        resolve(false);
      }, timeoutMs);
    });
    
    return await Promise.race([testPromise, timeoutPromise]);
    
  } catch (error) {
    console.warn('⚠️ PDF Worker test exception:', error);
    return false;
  }
};

// Initialize worker configuration with retry
const initializeWorker = async () => {
  const configured = configurePDFWorker();
  if (!configured) {
    console.error('🚨 Failed to configure PDF.js worker - PDF functionality may not work');
    return false;
  }
  
  // Test the worker
  const workerWorking = await testPDFWorker();
  if (!workerWorking) {
    console.warn('⚠️ PDF Worker test failed, but continuing anyway');
  }
  
  return true;
};

// Initialize immediately
initializeWorker();
