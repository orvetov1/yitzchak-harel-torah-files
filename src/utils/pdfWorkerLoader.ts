
// Simplified PDF worker loader using only local file
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

let initializationPromise: Promise<boolean> | null = null;

// Initialize worker with the local file only
const initWorker = async (): Promise<boolean> => {
  if (initializationPromise) {
    console.log('🔄 PDF Worker initialization already in progress...');
    return initializationPromise;
  }

  console.log('🚀 Starting PDF worker initialization with local file...');
  
  initializationPromise = initializePDFWorker(1); // Only 1 attempt needed
  
  try {
    const success = await initializationPromise;
    
    if (success) {
      console.log('✅ PDF worker initialized successfully from local file');
      const manager = PDFWorkerManager.getInstance();
      console.log('📊 Worker Status:', manager.getWorkerStatus());
    } else {
      console.error('❌ PDF worker initialization failed - local file not available');
      const manager = PDFWorkerManager.getInstance();
      console.log('🔍 Diagnostics:', manager.getDiagnostics());
    }
    
    return success;
  } catch (error) {
    console.error('💥 PDF Worker initialization error:', error);
    initializationPromise = null;
    return false;
  }
};

// Utility functions
export const getPDFWorkerDiagnostics = () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.getDiagnostics();
};

export const isPDFWorkerReady = () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.isInitialized();
};

export const getPDFWorkerStatus = () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.getWorkerStatus();
};

export const resetPDFWorker = async (): Promise<boolean> => {
  console.log('🔄 Resetting PDF Worker...');
  const manager = PDFWorkerManager.getInstance();
  initializationPromise = null;
  manager.reset();
  return await initWorker();
};

export const waitForPDFWorker = async (timeoutMs = 10000): Promise<boolean> => {
  console.log('⏳ Waiting for PDF Worker to be ready...');
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (isPDFWorkerReady()) {
      console.log('✅ PDF Worker is ready');
      return true;
    }
    
    if (!initializationPromise) {
      initWorker();
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.warn('⏰ Timeout waiting for PDF Worker');
  return false;
};

// Initialize immediately on module load
initWorker().catch(error => {
  console.error('Failed to initialize PDF worker on module load:', error);
});

// Legacy exports for compatibility
export const configurePDFWorker = initializePDFWorker;
export const testPDFWorker = async () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.isInitialized();
};
