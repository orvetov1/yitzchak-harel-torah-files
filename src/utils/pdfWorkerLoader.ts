
// Enhanced PDF worker loader with better error handling
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

let initializationPromise: Promise<boolean> | null = null;

// Initialize worker with enhanced error handling and retry logic
const initWorker = async (): Promise<boolean> => {
  if (initializationPromise) {
    console.log('🔄 PDF Worker initialization already in progress...');
    return initializationPromise;
  }

  console.log('🚀 Starting PDF worker initialization...');
  
  initializationPromise = initializePDFWorker(3); // Try up to 3 times
  
  try {
    const success = await initializationPromise;
    
    if (success) {
      console.log('✅ PDF worker initialized successfully');
      
      // Log worker status for debugging
      const manager = PDFWorkerManager.getInstance();
      console.log('📊 Worker Status:', manager.getWorkerStatus());
    } else {
      console.error('🚨 Failed to initialize PDF worker - PDF functionality will be limited');
      console.log('🔍 Diagnostics:', PDFWorkerManager.getInstance().getDiagnostics());
      
      // Still return the promise to allow fallback behavior
    }
    
    return success;
  } catch (error) {
    console.error('💥 PDF Worker initialization threw an error:', error);
    initializationPromise = null; // Reset so we can try again
    return false;
  }
};

// Export utilities for diagnostics and management
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
  manager.reset();
  initializationPromise = null;
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
    
    // If no initialization is in progress, start it
    if (!initializationPromise) {
      initWorker();
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
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
