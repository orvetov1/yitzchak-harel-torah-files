
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
      
      // First verify the worker file exists and is accessible
      const workerResponse = await fetch(localWorkerUrl, { method: 'HEAD' });
      if (!workerResponse.ok) {
        throw new Error(`Worker file not accessible: ${workerResponse.status} ${workerResponse.statusText}`);
      }
      
      // Get the first part of worker content to verify it's valid
      const workerContentResponse = await fetch(localWorkerUrl, {
        headers: { 'Range': 'bytes=0-1023' } // Get first 1KB to check
      });
      const workerContent = await workerContentResponse.text();
      
      if (!workerContent || workerContent.trim().length < 50) {
        throw new Error('Worker file appears to be empty or too small');
      }
      
      // Look for PDF.js indicators in the content
      const hasPDFJSIndicators = workerContent.includes('PDF.js') || 
                                 workerContent.includes('pdfjs') || 
                                 workerContent.includes('worker') ||
                                 workerContent.includes('function');
      
      if (!hasPDFJSIndicators) {
        console.warn('⚠️ Worker file may not contain expected PDF.js code');
      }
      
      console.log(`✅ Worker file verified (first 1KB checked)`);
      
      // Set the worker source
      pdfjs.GlobalWorkerOptions.workerSrc = localWorkerUrl;
      this.diagnostics.workerSource = localWorkerUrl;
      
      // Test worker functionality with a simpler approach
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
      
      // Create a much simpler valid PDF for testing
      const testPdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4\n
        0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 1 0 obj\n
        0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, // <</Type/Catalog
        0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, // /Pages 2 0 R>>\n
        0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj\n
        0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 2 0 obj\n
        0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, // <</Type/Pages
        0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x30, 0x3e, 0x3e, 0x0a, // /Count 0>>\n
        0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj\n
        0x78, 0x72, 0x65, 0x66, 0x0a, 0x30, 0x20, 0x33, 0x0a, // xref\n0 3\n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0a, // 0000000000 65535 f \n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, // 0000000009 00000 n \n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x34, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, // 0000000074 00000 n \n
        0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a, // trailer\n
        0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x33, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, // <</Size 3/Root 1 0 R>>\n
        0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x31, 0x31, 0x36, 0x0a, // startxref\n116\n
        0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a // %%EOF\n
      ]);

      const testPromise = pdfjs.getDocument({ 
        data: testPdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true,
        useWorkerFetch: false,
        isEvalSupported: false
      }).promise;
      
      // Shorter timeout for quicker feedback
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timeout after 3 seconds')), 3000);
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
