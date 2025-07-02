
// Lazy PDF worker loader - only initializes when needed
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;
let hasFailed = false;

// Initialize worker only when explicitly requested
const initWorker = async (): Promise<boolean> => {
  if (hasFailed) {
    console.log('🚫 PDF Worker previously failed, not retrying');
    return false;
  }

  if (isInitialized) {
    console.log('✅ PDF Worker already initialized');
    return true;
  }

  if (initializationPromise) {
    console.log('🔄 PDF Worker initialization already in progress...');
    return initializationPromise;
  }

  console.log('🚀 Starting PDF worker initialization (on-demand)...');
  
  initializationPromise = initializePDFWorker(1);
  
  try {
    const success = await initializationPromise;
    
    if (success) {
      console.log('✅ PDF worker initialized successfully');
      isInitialized = true;
      const manager = PDFWorkerManager.getInstance();
      console.log('📊 Worker Status:', manager.getWorkerStatus());
    } else {
      console.error('❌ PDF worker initialization failed');
      hasFailed = true;
      const manager = PDFWorkerManager.getInstance();
      console.log('🔍 Diagnostics:', manager.getDiagnostics());
    }
    
    return success;
  } catch (error) {
    console.error('💥 PDF Worker initialization error:', error);
    initializationPromise = null;
    hasFailed = true;
    return false;
  }
};

// Utility functions
export const getPDFWorkerDiagnostics = () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.getDiagnostics();
};

export const isPDFWorkerReady = () => {
  return isInitialized && !hasFailed;
};

export const getPDFWorkerStatus = () => {
  if (hasFailed) return '❌ נכשל';
  if (isInitialized) return '✅ פעיל';
  return '⏳ לא מאותחל';
};

export const initializePDFWorkerIfNeeded = async (): Promise<boolean> => {
  if (isPDFWorkerReady()) {
    return true;
  }
  
  if (hasFailed) {
    console.log('🚫 PDF Worker failed previously, not retrying automatically');
    return false;
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
