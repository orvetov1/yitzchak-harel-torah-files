
import { pdfjs } from 'react-pdf';

// Enhanced PDF worker configuration with proper ESM support for production
export class PDFWorkerManager {
  private static instance: PDFWorkerManager;
  private workerInitialized = false;
  private diagnostics: {
    workerSource: string;
    initialized: boolean;
    errors: string[];
    timestamp: number;
    fallbackMode: boolean;
    attempts: number;
  } = {
    workerSource: '',
    initialized: false,
    errors: [],
    timestamp: 0,
    fallbackMode: false,
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
    this.diagnostics.fallbackMode = false;

    console.log(`🚀 Initializing PDF Worker (attempt ${this.diagnostics.attempts})`);

    // Try different worker sources in order of preference
    const workerSources = [
      // Try to use the ESM worker entry from pdfjs-dist
      () => this.configureESMWorker(),
      // Local static file in public directory
      () => this.configureStaticWorker(`${window.location.origin}/pdf.worker.min.js`),
      // CDN fallbacks with version matching
      () => this.configureStaticWorker('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js'),
      () => this.configureStaticWorker('https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js')
    ];

    for (let i = 0; i < workerSources.length; i++) {
      console.log(`🔧 Trying PDF worker configuration ${i + 1}/${workerSources.length}`);
      
      try {
        const success = await workerSources[i]();
        if (success) {
          this.workerInitialized = true;
          this.diagnostics.initialized = true;
          
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ PDF Worker initialized successfully in ${elapsedTime}ms`);
          return true;
        }
      } catch (error) {
        const errorMsg = `Configuration ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.warn(`⚠️ ${errorMsg}`);
        this.diagnostics.errors.push(errorMsg);
      }
    }

    // If all configurations failed, enable fallback mode
    console.error('❌ All PDF worker configurations failed - enabling fallback mode');
    this.diagnostics.fallbackMode = true;
    return false;
  }

  private async configureESMWorker(): Promise<boolean> {
    try {
      console.log('🔧 Configuring standard PDF.js worker...');
      
      // Use the standard worker path that should be bundled with pdfjs-dist
      // This avoids the problematic ?worker&url syntax
      const workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url
      ).toString();
      
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      this.diagnostics.workerSource = 'ESM Standard Worker';
      console.log('✅ Standard PDF.js worker configured');
      
      return await this.testWorker();
    } catch (error) {
      console.warn('❌ Standard worker configuration failed:', error);
      throw error;
    }
  }

  private async configureStaticWorker(workerSrc: string): Promise<boolean> {
    try {
      console.log(`🔧 Configuring static worker: ${workerSrc}`);
      
      // Test if worker source is available
      const isAvailable = await this.testWorkerSource(workerSrc);
      if (!isAvailable) {
        throw new Error('Worker source not available');
      }

      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      this.diagnostics.workerSource = workerSrc;
      
      const success = await this.testWorker();
      if (success) {
        console.log(`✅ Static worker configured: ${workerSrc}`);
        return true;
      } else {
        throw new Error('Worker test failed');
      }
    } catch (error) {
      console.warn(`❌ Static worker configuration failed for ${workerSrc}:`, error);
      throw error;
    }
  }

  private async testWorkerSource(workerSrc: string): Promise<boolean> {
    try {
      if (workerSrc.startsWith('http')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(workerSrc, { 
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } else {
        // For local paths, assume available
        return true;
      }
    } catch (error) {
      console.warn(`❌ Worker source test failed for ${workerSrc}:`, error);
      return false;
    }
  }

  private async testWorker(timeoutMs = 5000): Promise<boolean> {
    try {
      console.log('🧪 Testing PDF Worker functionality...');
      
      // Create minimal test PDF data
      const testPdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
        0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a
      ]);

      const testPromise = pdfjs.getDocument({ 
        data: testPdfData,
        verbosity: 0
      }).promise;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Worker test timeout')), timeoutMs);
      });

      const pdfDoc = await Promise.race([testPromise, timeoutPromise]);
      
      if (pdfDoc && pdfDoc.numPages >= 0) {
        console.log('✅ PDF Worker test passed');
        return true;
      } else {
        throw new Error('Invalid PDF document returned');
      }
    } catch (error) {
      console.warn(`❌ PDF Worker test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  getDiagnostics() {
    return { ...this.diagnostics };
  }

  isInitialized(): boolean {
    return this.workerInitialized;
  }

  isFallbackMode(): boolean {
    return this.diagnostics.fallbackMode;
  }

  getWorkerStatus(): string {
    if (this.workerInitialized) {
      return `✅ Initialized (${this.diagnostics.workerSource})`;
    } else if (this.diagnostics.fallbackMode) {
      return '⚠️ Fallback mode - limited functionality';
    } else {
      return '❌ Not initialized';
    }
  }

  reset() {
    this.workerInitialized = false;
    this.diagnostics = {
      workerSource: '',
      initialized: false,
      errors: [],
      timestamp: 0,
      fallbackMode: false,
      attempts: 0
    };
    console.log('🔄 PDF Worker Manager reset');
  }
}

// Initialize worker with enhanced error handling
export const initializePDFWorker = async (retries = 2): Promise<boolean> => {
  const manager = PDFWorkerManager.getInstance();
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    console.log(`🚀 PDF Worker initialization attempt ${attempt}/${retries + 1}`);
    
    const success = await manager.initializeWorker();
    if (success) {
      return true;
    }
    
    if (attempt <= retries) {
      console.log(`⏳ Retrying PDF Worker initialization in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.warn('⚠️ PDF Worker initialization failed after all attempts');
  return false;
};

export default PDFWorkerManager;
