
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
      
      // First verify the worker file exists and is accessible
      const workerResponse = await fetch(localWorkerUrl, { method: 'HEAD' });
      if (!workerResponse.ok) {
        throw new Error(`Worker file not accessible: ${workerResponse.status} ${workerResponse.statusText}`);
      }
      
      // Get the actual worker content to verify it's not empty or corrupted
      const workerContentResponse = await fetch(localWorkerUrl);
      const workerContent = await workerContentResponse.text();
      
      if (!workerContent || workerContent.trim().length < 100) {
        throw new Error('Worker file appears to be empty or corrupted');
      }
      
      if (!workerContent.includes('PDF.js') && !workerContent.includes('pdfjs')) {
        console.warn('⚠️ Worker file may not be a valid PDF.js worker');
      }
      
      console.log(`✅ Worker file verified (${Math.round(workerContent.length / 1024)}KB)`);
      
      // Set the worker source
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
      
      // Create a minimal valid PDF for testing
      const testPdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
        0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, // \n1 0 obj
        0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, // \n<</Type
        0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, // /Catalog
        0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, // /Pages 2
        0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x65, //  0 R>>\ne
        0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x32, 0x20, // ndobj\n2 
        0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, // 0 obj\n<<
        0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, // /Type/Pa
        0x67, 0x65, 0x73, 0x2f, 0x43, 0x6f, 0x75, 0x6e, // ges/Coun
        0x74, 0x20, 0x30, 0x3e, 0x3e, 0x0a, 0x65, 0x6e, // t 0>>\nen
        0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x78, 0x72, 0x65, // dobj\nxre
        0x66, 0x0a, 0x30, 0x20, 0x33, 0x0a, 0x30, 0x30, // f\n0 3\n00
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, // 00000000
        0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, //  65535 f
        0x20, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, //  \n000000
        0x30, 0x30, 0x30, 0x39, 0x20, 0x30, 0x30, 0x30, // 0009 000
        0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, 0x30, 0x30, // 00 n \n00
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x34, // 00000074
        0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, //  00000 n
        0x20, 0x0a, 0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, //  \ntraile
        0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, // r\n<</Siz
        0x65, 0x20, 0x33, 0x2f, 0x52, 0x6f, 0x6f, 0x74, // e 3/Root
        0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, //  1 0 R>>
        0x0a, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, // \nstartxr
        0x65, 0x66, 0x0a, 0x31, 0x31, 0x36, 0x0a, 0x25, // ef\n116\n%
        0x25, 0x45, 0x4f, 0x46, 0x0a                    // %EOF\n
      ]);

      const testPromise = pdfjs.getDocument({ 
        data: testPdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true
      }).promise;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timeout after 5 seconds')), 5000);
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
