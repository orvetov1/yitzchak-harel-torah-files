
import { pdfjs } from 'react-pdf';

// Local PDF worker configuration with fallbacks
export class PDFWorkerManager {
  private static instance: PDFWorkerManager;
  private workerInitialized = false;
  private diagnostics: {
    workerSource: string;
    initialized: boolean;
    errors: string[];
    timestamp: number;
  } = {
    workerSource: '',
    initialized: false,
    errors: [],
    timestamp: 0
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

    // Try multiple worker sources in order of preference
    const workerSources = [
      // Local first (best performance, no network dependency)
      '/pdf.worker.min.js',
      // CDN fallbacks with version-specific URLs
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
      // Generic fallback
      `https://cdn.jsdelivr.net/npm/pdfjs-dist/build/pdf.worker.min.js`
    ];

    for (let i = 0; i < workerSources.length; i++) {
      const workerSrc = workerSources[i];
      console.log(`🔧 Trying PDF worker source ${i + 1}/${workerSources.length}: ${workerSrc}`);
      
      try {
        // Test if worker source is available
        if (workerSrc.startsWith('http')) {
          const response = await fetch(workerSrc, { method: 'HEAD' });
          if (!response.ok || response.status >= 400) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }

        // Configure PDF.js worker
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        
        // Test the worker with a simple document
        const testSuccess = await this.testWorker();
        if (testSuccess) {
          this.workerInitialized = true;
          this.diagnostics.workerSource = workerSrc;
          this.diagnostics.initialized = true;
          
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ PDF Worker initialized successfully in ${elapsedTime}ms using: ${workerSrc}`);
          
          // Cache successful worker source
          localStorage.setItem('pdf-worker-source', workerSrc);
          return true;
        }
      } catch (error) {
        const errorMsg = `Failed with ${workerSrc}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.warn(`⚠️ ${errorMsg}`);
        this.diagnostics.errors.push(errorMsg);
      }
    }

    console.error('❌ All PDF worker sources failed');
    return false;
  }

  private async testWorker(timeoutMs = 3000): Promise<boolean> {
    try {
      // Create a minimal test PDF data
      const testPdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
        0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, // basic PDF structure
        0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65,
        0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67,
        0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62,
        0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x30,
        0x20, 0x32, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30,
        0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35,
        0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0a, 0x30,
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
        0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20,
        0x6e, 0x20, 0x0a, 0x74, 0x72, 0x61, 0x69, 0x6c,
        0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69,
        0x7a, 0x65, 0x20, 0x32, 0x2f, 0x52, 0x6f, 0x6f,
        0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e,
        0x3e, 0x0a, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78,
        0x72, 0x65, 0x66, 0x0a, 0x31, 0x30, 0x34, 0x0a,
        0x25, 0x25, 0x45, 0x4f, 0x46 // %%EOF
      ]);

      const testPromise = pdfjs.getDocument({ data: testPdfData }).promise;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timeout')), timeoutMs);
      });

      await Promise.race([testPromise, timeoutPromise]);
      console.log('🧪 PDF Worker test passed');
      return true;
    } catch (error) {
      console.warn(`🧪 PDF Worker test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  getDiagnostics() {
    return { ...this.diagnostics };
  }

  isInitialized(): boolean {
    return this.workerInitialized;
  }

  reset() {
    this.workerInitialized = false;
    this.diagnostics = {
      workerSource: '',
      initialized: false,
      errors: [],
      timestamp: 0
    };
    localStorage.removeItem('pdf-worker-source');
  }
}

// Initialize worker on module load
export const initializePDFWorker = async (): Promise<boolean> => {
  const manager = PDFWorkerManager.getInstance();
  return await manager.initializeWorker();
};

export default PDFWorkerManager;
