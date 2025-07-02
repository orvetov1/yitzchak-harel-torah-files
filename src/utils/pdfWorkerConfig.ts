
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
      
      // Simple check - just set the worker source
      pdfjs.GlobalWorkerOptions.workerSrc = localWorkerUrl;
      this.diagnostics.workerSource = localWorkerUrl;
      
      // Test worker functionality with a minimal PDF
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
      const errorMsg = `Local worker failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      this.diagnostics.errors.push(errorMsg);
      return false;
    }
  }

  private async testWorker(): Promise<boolean> {
    try {
      console.log('🧪 Testing PDF Worker functionality...');
      
      const testPdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
        0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a        // %%EOF
      ]);

      const testPromise = pdfjs.getDocument({ 
        data: testPdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true
      }).promise;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timeout')), 5000);
      });

      const pdfDoc = await Promise.race([testPromise, timeoutPromise]);
      
      if (pdfDoc && typeof pdfDoc.numPages === 'number' && pdfDoc.numPages >= 0) {
        console.log('✅ PDF Worker functionality test PASSED');
        return true;
      } else {
        throw new Error('Invalid PDF document returned from worker test');
      }
    } catch (error) {
      console.warn(`❌ PDF Worker functionality test FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  getDiagnostics() {
    return { 
      ...this.diagnostics,
      currentWorkerSrc: pdfjs.GlobalWorkerOptions.workerSrc || 'Not set'
    };
  }

  isInitialized(): boolean {
    return this.workerInitialized;
  }

  getWorkerStatus(): string {
    if (this.workerInitialized) {
      return '✅ פעיל (מקומי)';
    } else {
      return '❌ לא מאותחל';
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
  
  console.error('❌ PDF Worker initialization failed - local worker not available');
  return false;
};

export default PDFWorkerManager;
