
// Simplified PDF worker loader using centralized configuration with static paths
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

let initializationPromise: Promise<boolean> | null = null;

// Initialize worker with the new static path configuration
const initWorker = async (): Promise<boolean> => {
  if (initializationPromise) {
    console.log('🔄 PDF Worker initialization already in progress...');
    return initializationPromise;
  }

  console.log('🚀 Starting enhanced PDF worker initialization with static paths...');
  
  initializationPromise = initializePDFWorker(2); // Try up to 2 retries
  
  try {
    const success = await initializationPromise;
    
    if (success) {
      console.log('✅ Enhanced PDF worker initialized successfully');
      const manager = PDFWorkerManager.getInstance();
      console.log('📊 Worker Status:', manager.getWorkerStatus());
      console.log('🔍 Worker Diagnostics:', manager.getDiagnostics());
    } else {
      console.error('🚨 Enhanced PDF worker initialization failed - using fallback mode');
      const manager = PDFWorkerManager.getInstance();
      console.log('🔍 Failure Diagnostics:', manager.getDiagnostics());
    }
    
    return success;
  } catch (error) {
    console.error('💥 Enhanced PDF Worker initialization error:', error);
    initializationPromise = null;
    return false;
  }
};

// Enhanced utility functions
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
  console.log('🔄 Resetting Enhanced PDF Worker...');
  const manager = PDFWorkerManager.getInstance();
  initializationPromise = null;
  return await manager.resetAndRetry();
};

export const waitForPDFWorker = async (timeoutMs = 15000): Promise<boolean> => {
  console.log('⏳ Waiting for Enhanced PDF Worker to be ready...');
  
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (isPDFWorkerReady()) {
      console.log('✅ Enhanced PDF Worker is ready');
      return true;
    }
    
    if (!initializationPromise) {
      initWorker();
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.warn('⏰ Timeout waiting for Enhanced PDF Worker');
  return false;
};

// Initialize immediately on module load
initWorker().catch(error => {
  console.error('Failed to initialize enhanced PDF worker on module load:', error);
});

// Legacy exports for compatibility
export const configurePDFWorker = initializePDFWorker;
export const testPDFWorker = async () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.isInitialized();
};
