
// src/utils/pdfWorkerConfig.ts
import { pdfjs } from 'react-pdf';

export class PDFWorkerManager {
  private static instance: PDFWorkerManager;
  private workerInitialized = false;
  private diagnostics: {
    workerSource: string;
    initialized: boolean;
    errors: string[];
    timestamp: number;
    attempts: number;
    lastError?: string;
    fileSize?: number;
    fileContent?: string;
  } = {
    workerSource: '',
    initialized: false,
    errors: [],
    timestamp: 0,
    attempts: 0
  };

  private constructor() {}

  static getInstance(): PDFWorkerManager {
    if (!PDFWorkerManager.instance) {
      PDFWorkerManager.instance = new PDFWorkerManager();
    }
    return PDFWorkerManager.instance;
  }

  async initializeWorker(): Promise<boolean> {
    if (this.workerInitialized) {
      console.log('📄 PDF Worker already initialized');
      return true;
    }

    const startTime = Date.now();
    this.diagnostics.errors = [];
    this.diagnostics.timestamp = startTime;
    this.diagnostics.attempts++;

    console.log(`🚀 Initializing PDF Worker (attempt ${this.diagnostics.attempts})`);

    // Use only the local worker file
    const localWorkerUrl = `${window.location.origin}/pdf.worker.min.js`;
    
    try {
      console.log(`🔧 Using local PDF worker: ${localWorkerUrl}`);
      
      // Enhanced file verification
      const workerResponse = await fetch(localWorkerUrl, { method: 'HEAD' });
      if (!workerResponse.ok) {
        throw new Error(`Worker file not accessible: ${workerResponse.status} ${workerResponse.statusText}`);
      }
      
      // Check file size - a real PDF.js worker should be at least 1MB
      const contentLength = workerResponse.headers.get('Content-Length');
      const fileSize = contentLength ? parseInt(contentLength) : 0;
      this.diagnostics.fileSize = fileSize;
      
      console.log(`📏 Worker file size: ${fileSize} bytes (${Math.round(fileSize / 1024)}KB)`);
      
      // Real PDF.js worker should be much larger than a few KB
      if (fileSize < 100000) { // Less than 100KB is suspicious
        throw new Error(`Worker file appears to be corrupted or incomplete (only ${Math.round(fileSize / 1024)}KB, expected at least 1MB)`);
      }
      
      // Get file content to verify it's a valid worker
      const workerContentResponse = await fetch(localWorkerUrl, {
        headers: { 'Range': 'bytes=0-2047' } // Get first 2KB
      });
      const workerContent = await workerContentResponse.text();
      this.diagnostics.fileContent = workerContent.substring(0, 200) + '...';
      
      if (!workerContent || workerContent.trim().length < 100) {
        throw new Error('Worker file appears to be empty or too small');
      }
      
      // Check for PDF.js worker indicators
      const hasWorkerIndicators = workerContent.includes('PDF.js') || 
                                 workerContent.includes('pdfjs') ||
                                 workerContent.includes('GlobalWorkerOptions') ||
                                 workerContent.includes('function') ||
                                 workerContent.includes('var ') ||
                                 workerContent.includes('!function');
      
      if (!hasWorkerIndicators) {
        throw new Error('Worker file does not contain expected PDF.js worker code');
      }
      
      console.log(`✅ Worker file verified (${Math.round(fileSize / 1024)}KB, contains valid JS code)`);
      
      // Set the worker source
      pdfjs.GlobalWorkerOptions.workerSrc = localWorkerUrl;
      this.diagnostics.workerSource = localWorkerUrl;
      
      // Test worker functionality
      const success = await this.testWorker();
      if (success) {
        this.workerInitialized = true;
        this.diagnostics.initialized = true;
        
        const elapsedTime = Date.now() - startTime;
        console.log(`✅ PDF Worker initialized successfully in ${elapsedTime}ms`);
        return true;
      } else {
        throw new Error('Worker functionality test failed');
      }
    } catch (error) {
      const errorMsg = `Worker initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      this.diagnostics.errors.push(errorMsg);
      this.diagnostics.lastError = errorMsg;
      return false;
    }
  }

  private async testWorker(): Promise<boolean> {
    try {
      console.log('🧪 Testing PDF Worker functionality...');
      
      // Create a minimal valid PDF for testing - smaller and simpler
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

      const testPromise = pdfjs.getDocument({ 
        data: testPdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true,
        useWorkerFetch: false,
        isEvalSupported: false
      }).promise;
      
      // Very short timeout for quick feedback
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timeout after 2 seconds')), 2000);
      });

      const pdfDoc = await Promise.race([testPromise, timeoutPromise]);
      
      if (pdfDoc && typeof pdfDoc.numPages === 'number' && pdfDoc.numPages >= 0) {
        console.log('✅ PDF Worker functionality test PASSED');
        return true;
      } else {
        throw new Error('Invalid PDF document returned from worker test');
      }
    } catch (error) {
      const errorMsg = `Worker test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.warn(`❌ ${errorMsg}`);
      this.diagnostics.errors.push(errorMsg);
      this.diagnostics.lastError = errorMsg;
      return false;
    }
  }

  getDiagnostics() {
    return { 
      ...this.diagnostics,
      currentWorkerSrc: pdfjs.GlobalWorkerOptions.workerSrc || 'Not set',
      isReady: this.workerInitialized
    };
  }

  isInitialized(): boolean {
    return this.workerInitialized;
  }

  getWorkerStatus(): string {
    if (this.workerInitialized) {
      return '✅ פעיל';
    } else if (this.diagnostics.attempts > 0) {
      return '❌ נכשל';
    } else {
      return '⏳ לא מאותחל';
    }
  }

  reset() {
    this.workerInitialized = false;
    this.diagnostics = {
      workerSource: '',
      initialized: false,
      errors: [],
      timestamp: 0,
      attempts: 0
    };
    pdfjs.GlobalWorkerOptions.workerSrc = '';
    console.log('🔄 PDF Worker Manager reset completed');
  }
}

export const initializePDFWorker = async (retries = 1): Promise<boolean> => {
  const manager = PDFWorkerManager.getInstance();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`🚀 PDF Worker initialization attempt ${attempt}/${retries}`);
    
    const success = await manager.initializeWorker();
    if (success) {
      return true;
    }
    
    if (attempt < retries) {
      console.log(`⏳ Retrying PDF Worker initialization in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('❌ PDF Worker initialization failed after all retries');
  return false;
};

export default PDFWorkerManager;
