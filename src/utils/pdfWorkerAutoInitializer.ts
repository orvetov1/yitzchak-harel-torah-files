
// Auto-initializer for PDF Worker - ensures worker is ready when needed
import { initializePDFWorkerIfNeeded, isPDFWorkerReady, resetPDFWorker } from './pdfWorkerLoader';
import { pdfjs } from 'react-pdf';

let isAutoInitializing = false;
let initPromise: Promise<boolean> | null = null;

// Auto-initialize PDF Worker when first PDF operation is attempted
export const ensurePDFWorkerReady = async (): Promise<boolean> => {
  // If already ready, return immediately
  if (isPDFWorkerReady()) {
    console.log('✅ PDF Worker already ready');
    return true;
  }

  // If already initializing, wait for that process
  if (isAutoInitializing && initPromise) {
    console.log('⏳ Waiting for ongoing PDF Worker initialization...');
    return await initPromise;
  }

  // Start initialization
  console.log('🚀 Auto-initializing PDF Worker...');
  isAutoInitializing = true;
  
  initPromise = initializePDFWorkerIfNeeded();
  
  try {
    const success = await initPromise;
    isAutoInitializing = false;
    
    if (success) {
      console.log('✅ PDF Worker auto-initialization successful');
    } else {
      console.warn('⚠️ PDF Worker auto-initialization failed');
    }
    
    return success;
  } catch (error) {
    console.error('❌ PDF Worker auto-initialization error:', error);
    isAutoInitializing = false;
    return false;
  }
};

// Enhanced PDF options for better compatibility with Supabase
export const createOptimizedPDFOptions = (fileUrl: string) => {
  return {
    url: fileUrl,
    httpHeaders: {
      'Accept': 'application/pdf,*/*',
    'Cache-Control': 'no-cache' // שינוי כאן
    },
    withCredentials: false,
    // Optimize for Supabase Storage
    disableAutoFetch: true, // Allow range requests if supported
    disableStream: true,    // Allow streaming if supported
    disableRange: true,     // Allow range requests if supported
    // Fallback options for problematic servers
    useWorkerFetch: true,   // Use main thread for fetching
    isEvalSupported: false,  // Disable eval for security
    verbosity: process.env.NODE_ENV === 'development' ? 1 : 0
  };
};

// Test if server supports range requests
export const testRangeSupport = async (fileUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      headers: { 'Range': 'bytes=0-1' }
    });
    
    const acceptRanges = response.headers.get('Accept-Ranges');
    const isRangeSupported = acceptRanges === 'bytes' || response.status === 206;
    
    console.log(`📊 Range support for ${fileUrl}: ${isRangeSupported ? 'YES' : 'NO'}`);
    return isRangeSupported;
  } catch (error) {
    console.warn('⚠️ Could not test range support:', error);
    return false;
  }
};

// Enhanced PDF document loader with auto-worker initialization
export const loadPDFDocument = async (fileUrl: string) => {
  // Ensure worker is ready first
  const workerReady = await ensurePDFWorkerReady();
  if (!workerReady) {
    throw new Error('PDF Worker is not available');
  }

  // Test range support and adjust options accordingly
  const supportsRange = await testRangeSupport(fileUrl);
  const options = createOptimizedPDFOptions(fileUrl);
  
  if (!supportsRange) {
    console.log('📥 Server does not support range requests, using full download');
    options.disableRange = true;
    options.disableStream = true;
  }

  console.log('📄 Loading PDF document with options:', options);
  
  return pdfjs.getDocument(options);
};
