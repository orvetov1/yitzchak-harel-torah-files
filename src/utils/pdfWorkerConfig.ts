
import { pdfjs } from 'react-pdf';

// Enhanced PDF worker configuration with static path for production reliability
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
      // Local static file in public directory (most reliable)
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

  private async configureStaticWorker(workerSrc: string): Promise<boolean> {
    try {
      console.log(`🔧 Configuring static worker: ${workerSrc}`);
      
      // Test if worker source is available with enhanced checking
      const isAvailable = await this.testWorkerSource(workerSrc);
      if (!isAvailable) {
        throw new Error('Worker source not available or not accessible');
      }

      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      this.diagnostics.workerSource = workerSrc;
      
      const success = await this.testWorker();
      if (success) {
        console.log(`✅ Static worker configured successfully: ${workerSrc}`);
        return true;
      } else {
        throw new Error('Worker functionality test failed');
      }
    } catch (error) {
      console.warn(`❌ Static worker configuration failed for ${workerSrc}:`, error);
      throw error;
    }
  }

  private async testWorkerSource(workerSrc: string): Promise<boolean> {
    try {
      console.log(`🧪 Testing worker source availability: ${workerSrc}`);
      
      if (workerSrc.startsWith('http')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout
        
        const response = await fetch(workerSrc, { 
          method: 'HEAD',
          signal: controller.signal,
          mode: 'cors',
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        const available = response.ok && response.status === 200;
        console.log(`📊 Worker source test result: ${available ? 'AVAILABLE' : 'NOT AVAILABLE'} (status: ${response.status})`);
        return available;
      } else {
        // For local paths, assume available but log
        console.log('📍 Local worker path - assuming available');
        return true;
      }
    } catch (error) {
      console.warn(`❌ Worker source availability test failed for ${workerSrc}:`, error);
      return false;
    }
  }

  private async testWorker(timeoutMs = 8000): Promise<boolean> {
    try {
      console.log('🧪 Testing PDF Worker functionality...');
      
      // Create minimal test PDF data (valid PDF header)
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
        setTimeout(() => reject(new Error('Worker functionality test timeout')), timeoutMs);
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

  // Manual reset function for troubleshooting
  async resetAndRetry(): Promise<boolean> {
    console.log('🔄 Manual PDF Worker reset initiated');
    this.reset();
    return await this.initializeWorker();
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

  isFallbackMode(): boolean {
    return this.diagnostics.fallbackMode;
  }

  getWorkerStatus(): string {
    if (this.workerInitialized) {
      return `✅ פעיל (${this.diagnostics.workerSource.includes('pdf.worker.min.js') ? 'מקומי' : 'CDN'})`;
    } else if (this.diagnostics.fallbackMode) {
      return '⚠️ מצב חלופי - פונקציונליות מוגבלת';
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
      fallbackMode: false,
      attempts: 0
    };
    // Clear any existing worker configuration
    pdfjs.GlobalWorkerOptions.workerSrc = '';
    console.log('🔄 PDF Worker Manager reset completed');
  }
}

// Initialize worker with enhanced error handling and retries
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
  
  console.warn('⚠️ PDF Worker initialization failed after all attempts - continuing in fallback mode');
  return false;
};

export default PDFWorkerManager;
