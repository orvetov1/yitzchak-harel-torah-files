
// Lazy PDF worker loader - only initializes when needed
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

let initializationPromise: Promise<boolean> | null = null;
let isInitialized = false;
let hasFailed = false;

// Initialize worker only when explicitly requested
const initWorker = async (forceRetry = false): Promise<boolean> => {
  if (hasFailed && !forceRetry) {
    console.log('🚫 PDF Worker previously failed, use forceRetry to retry');
    return false;
  }

  if (isInitialized && !forceRetry) {
    console.log('✅ PDF Worker already initialized');
    return true;
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
      console.log('✅ PDF worker initialized successfully');
      isInitialized = true;
      hasFailed = false;
      const manager = PDFWorkerManager.getInstance();
      console.log('📊 Worker Status:', manager.getWorkerStatus());
    } else {
      console.error('❌ PDF worker initialization failed');
      hasFailed = true;
      isInitialized = false;
      const manager = PDFWorkerManager.getInstance();
      console.log('🔍 Diagnostics:', manager.getDiagnostics());
    }
    
    return success;
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
    recommendations.push('ודא שהקובץ pdf.worker.min.js נמצא בתיקיית public/');
  }
  
  if (diagnostics.attempts > 3) {
    recommendations.push('רענן את הדף או נסה להוריד את הקובץ ישירות');
  }
  
  return recommendations;
};

export const isPDFWorkerReady = () => {
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
