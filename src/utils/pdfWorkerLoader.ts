
// Lazy PDF worker loader - only initializes when needed
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;
let hasFailed = false;

// Check if worker is actually working by testing it
const testWorkerFunctionality = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing PDF Worker functionality...');
    
    // Create minimal test PDF
    const testPdfData = new Uint8Array([
      37, 80, 68, 70, 45, 49, 46, 52, 10, // %PDF-1.4\n
      49, 32, 48, 32, 111, 98, 106, 10, // 1 0 obj\n
      60, 60, 47, 84, 121, 112, 101, 47, 67, 97, 116, 97, 108, 111, 103, 47, 80, 97, 103, 101, 115, 32, 50, 32, 48, 32, 82, 62, 62, 10, // <</Type/Catalog/Pages 2 0 R>>\n
      101, 110, 100, 111, 98, 106, 10, // endobj\n
      50, 32, 48, 32, 111, 98, 106, 10, // 2 0 obj\n
      60, 60, 47, 84, 121, 112, 101, 47, 80, 97, 103, 101, 115, 47, 67, 111, 117, 110, 116, 32, 48, 62, 62, 10, // <</Type/Pages/Count 0>>\n
      101, 110, 100, 111, 98, 106, 10, // endobj\n
      120, 114, 101, 102, 10, 48, 32, 51, 10, // xref\n0 3\n
      48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 32, 54, 53, 53, 51, 53, 32, 102, 32, 10, // 0000000000 65535 f \n
      48, 48, 48, 48, 48, 48, 48, 48, 48, 57, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, // 0000000009 00000 n \n
      48, 48, 48, 48, 48, 48, 48, 48, 55, 56, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, // 0000000078 00000 n \n
      116, 114, 97, 105, 108, 101, 114, 10, // trailer\n
      60, 60, 47, 83, 105, 122, 101, 32, 51, 47, 82, 111, 111, 116, 32, 49, 32, 48, 32, 82, 62, 62, 10, // <</Size 3/Root 1 0 R>>\n
      115, 116, 97, 114, 116, 120, 114, 101, 102, 10, 49, 50, 51, 10, // startxref\n123\n
      37, 37, 69, 79, 70, 10 // %%EOF\n
    ]);

    const { pdfjs } = await import('react-pdf');
    
    const testPromise = pdfjs.getDocument({ 
      data: testPdfData,
      verbosity: 0
    }).promise;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Worker test timeout')), 2000);
    });

    const pdfDoc = await Promise.race([testPromise, timeoutPromise]);
    
    if (pdfDoc && typeof pdfDoc.numPages === 'number') {
      console.log('✅ PDF Worker functionality test PASSED');
      return true;
    } else {
      throw new Error('Invalid PDF document returned');
    }
  } catch (error) {
    console.error('❌ PDF Worker functionality test FAILED:', error);
    return false;
  }
};

// Initialize worker only when explicitly requested
const initWorker = async (forceRetry = false): Promise<boolean> => {
  if (hasFailed && !forceRetry) {
    console.log('🚫 PDF Worker previously failed, use forceRetry to retry');
    return false;
  }

  if (isInitialized && !forceRetry) {
    // Double check that worker is actually working
    const isWorking = await testWorkerFunctionality();
    if (isWorking) {
      console.log('✅ PDF Worker already initialized and working');
      return true;
    } else {
      console.warn('⚠️ PDF Worker was marked as initialized but not working, resetting...');
      isInitialized = false;
      hasFailed = false;
    }
  }

  if (initializationPromise && !forceRetry) {
    console.log('🔄 PDF Worker initialization already in progress...');
    return initializationPromise;
  }

  console.log('🚀 Starting PDF worker initialization (on-demand)...');
  
  // Reset state if forcing retry
  if (forceRetry) {
    isInitialized = false;
    hasFailed = false;
    initializationPromise = null;
  }
  
  initializationPromise = initializePDFWorker(1);
  
  try {
    const success = await initializationPromise;
    
    if (success) {
      // Double check functionality
      const isWorking = await testWorkerFunctionality();
      if (isWorking) {
        console.log('✅ PDF worker initialized and tested successfully');
        isInitialized = true;
        hasFailed = false;
        return true;
      } else {
        console.error('❌ PDF worker initialized but functionality test failed');
        hasFailed = true;
        isInitialized = false;
        return false;
      }
    } else {
      console.error('❌ PDF worker initialization failed');
      hasFailed = true;
      isInitialized = false;
      const manager = PDFWorkerManager.getInstance();
      console.log('🔍 Diagnostics:', manager.getDiagnostics());
      return false;
    }
  } catch (error) {
    console.error('💥 PDF Worker initialization error:', error);
    initializationPromise = null;
    hasFailed = true;
    isInitialized = false;
    return false;
  }
};

// Utility functions
export const getPDFWorkerDiagnostics = () => {
  const manager = PDFWorkerManager.getInstance();
  const diagnostics = manager.getDiagnostics();
  
  // Add enhanced diagnostics
  return {
    ...diagnostics,
    isCorrupted: diagnostics.errors.some(error => 
      error.includes('corrupted') || 
      error.includes('incomplete') || 
      error.includes('empty') ||
      error.includes('too small')
    ),
    recommendations: getRecommendations(diagnostics)
  };
};

const getRecommendations = (diagnostics: any): string[] => {
  const recommendations = [];
  
  if (diagnostics.fileSize && diagnostics.fileSize < 100000) {
    recommendations.push('החלף את קובץ pdf.worker.min.js בקובץ מלא מ-node_modules/pdfjs-dist/build/');
  }
  
  if (diagnostics.errors.some((e: string) => e.includes('timeout'))) {
    recommendations.push('בדוק את מהירות החיבור לאינטרנט');
  }
  
  if (diagnostics.errors.some((e: string) => e.includes('not accessible'))) {
    recommendations.push('ודא שהקובץ pdf.worker.mjs נמצא בתיקיית public/');
  }
  
  if (diagnostics.attempts > 3) {
    recommendations.push('רענן את הדף או נסה להוריד את הקובץ ישירות');
  }
  
  return recommendations;
};

export const isPDFWorkerReady = (): boolean => {
  return isInitialized && !hasFailed;
};

export const getPDFWorkerStatus = () => {
  const diagnostics = getPDFWorkerDiagnostics();
  
  if (hasFailed) {
    if (diagnostics.isCorrupted) {
      return '🔧 קובץ פגום';
    }
    return '❌ נכשל';
  }
  if (isInitialized) return '✅ פעיל';
  return '⏳ לא מאותחל';
};

export const initializePDFWorkerIfNeeded = async (): Promise<boolean> => {
  if (isPDFWorkerReady()) {
    console.log('✅ PDF Worker already ready');
    return true;
  }
  
  if (hasFailed) {
    console.log('🚫 PDF Worker failed previously, trying to reset and retry...');
    return await initWorker(true); // Force retry
  }
  
  console.log('🎯 Initializing PDF Worker on demand...');
  return await initWorker();
};

export const resetPDFWorker = async (): Promise<boolean> => {
  console.log('🔄 Resetting PDF Worker...');
  const manager = PDFWorkerManager.getInstance();
  initializationPromise = null;
  isInitialized = false;
  hasFailed = false;
  manager.reset();
  return await initWorker(true); // Force retry
};

export const waitForPDFWorker = async (timeoutMs = 5000): Promise<boolean> => {
  console.log('⏳ Waiting for PDF Worker to be ready...');
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (isPDFWorkerReady()) {
      console.log('✅ PDF Worker is ready');
      return true;
    }
    
    if (hasFailed) {
      console.log('❌ PDF Worker failed, stopping wait');
      return false;
    }
    
    if (!initializationPromise) {
      initWorker();
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.warn('⏰ Timeout waiting for PDF Worker');
  return false;
};

// Legacy exports for compatibility - but don't auto-initialize
export const configurePDFWorker = initializePDFWorker;
export const testPDFWorker = async () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.isInitialized();
};

// DON'T initialize on module load - only when needed
console.log('📄 PDF Worker Loader loaded (lazy mode)');
