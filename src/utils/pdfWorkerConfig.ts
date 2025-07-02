
import { pdfjs } from 'react-pdf';

// Enhanced PDF worker configuration with robust fallbacks
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

    // Check cached worker source first
    const cachedWorkerSource = localStorage.getItem('pdf-worker-source');
    let workerSources = [];

    if (cachedWorkerSource) {
      console.log(`📋 Found cached worker source: ${cachedWorkerSource}`);
      workerSources.push(cachedWorkerSource);
    }

    // Add all potential worker sources
    workerSources.push(
      `${window.location.origin}/pdf.worker.min.js`, // Local file - highest priority
      '/pdf.worker.min.js', // Relative path fallback
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js', // Specific version
      'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js', // Alternative CDN
      'https://cdn.jsdelivr.net/npm/pdfjs-dist/build/pdf.worker.min.js' // Generic fallback
    );

    // Remove duplicates
    workerSources = [...new Set(workerSources)];

    for (let i = 0; i < workerSources.length; i++) {
      const workerSrc = workerSources[i];
      console.log(`🔧 Trying PDF worker source ${i + 1}/${workerSources.length}: ${workerSrc}`);
      
      try {
        // Test worker source availability
        const isAvailable = await this.testWorkerSource(workerSrc);
        if (!isAvailable) {
          throw new Error('Worker source not available');
        }

        // Configure PDF.js worker
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        console.log(`⚙️ Configured PDF.js with worker: ${workerSrc}`);
        
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

    // If all workers failed, enable fallback mode
    console.error('❌ All PDF worker sources failed - enabling fallback mode');
    this.diagnostics.fallbackMode = true;
    
    // Try to use a basic fallback configuration
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = null;
      console.log('🔄 Attempting to use inline worker as last resort');
      return false; // Still consider this a failure, but don't crash
    } catch (fallbackError) {
      console.error('❌ Even fallback configuration failed:', fallbackError);
      return false;
    }
  }

  private async testWorkerSource(workerSrc: string): Promise<boolean> {
    try {
      if (workerSrc.startsWith('http')) {
        // Test external sources
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(workerSrc, { 
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ Worker source available: ${workerSrc}`);
        return true;
      } else {
        // For local/relative paths, assume they're available
        console.log(`📁 Using local worker file: ${workerSrc}`);
        return true;
      }
    } catch (error) {
      console.warn(`❌ Worker source test failed for ${workerSrc}:`, error);
      return false;
    }
  }

  private async testWorker(timeoutMs = 3000): Promise<boolean> {
    try {
      console.log('🧪 Testing PDF Worker functionality...');
      
      // Create a minimal test PDF data
      const testPdfData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
        0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46, 0x0a // Basic PDF structure with %%EOF
      ]);

      const testPromise = pdfjs.getDocument({ 
        data: testPdfData,
        verbosity: 0 // Reduce console noise during test
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
      return `✅ Initialized with ${this.diagnostics.workerSource}`;
    } else if (this.diagnostics.fallbackMode) {
      return '⚠️ Fallback mode (limited functionality)';
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
    localStorage.removeItem('pdf-worker-source');
    console.log('🔄 PDF Worker Manager reset');
  }
}

// Initialize worker on module load with retry mechanism
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
