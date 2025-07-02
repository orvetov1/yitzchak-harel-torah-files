
// Updated to use the new worker manager
import PDFWorkerManager, { initializePDFWorker } from './pdfWorkerConfig';

// Initialize worker with new manager
const initWorker = async () => {
  console.log('🚀 Initializing PDF worker with new manager...');
  const success = await initializePDFWorker();
  
  if (!success) {
    console.error('🚨 Failed to initialize PDF worker - PDF functionality may be limited');
  } else {
    console.log('✅ PDF worker initialized successfully');
  }
  
  return success;
};

// Export utilities for diagnostics
export const getPDFWorkerDiagnostics = () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.getDiagnostics();
};

export const isPDFWorkerReady = () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.isInitialized();
};

export const resetPDFWorker = async () => {
  const manager = PDFWorkerManager.getInstance();
  manager.reset();
  return await manager.initializeWorker();
};

// Initialize immediately
initWorker();

// Legacy export for compatibility
export const configurePDFWorker = initializePDFWorker;
export const testPDFWorker = async () => {
  const manager = PDFWorkerManager.getInstance();
  return manager.isInitialized();
};
