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

    // Prioritize local static file
    const localWorkerUrl = `${window.location.origin}/pdf.worker.min.js`; // יעדף את הקובץ המקומי
    // CDN fallbacks with version matching the installed pdfjs-dist
    const cdnWorkerUrls = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
    ];

    const workerSourcesToTry = [localWorkerUrl, ...cdnWorkerUrls];

    for (let i = 0; i < workerSourcesToTry.length; i++) {
      const workerSrc = workerSourcesToTry[i];
      console.log(`🔧 Trying PDF worker configuration ${i + 1}/${workerSourcesToTry.length}: ${workerSrc}`);
      
      try {
        const isAvailable = await this.testWorkerSource(workerSrc);
        if (!isAvailable) {
          throw new Error('Worker source not available or not accessible');
        }

        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        this.diagnostics.workerSource = workerSrc;
        
        const success = await this.testWorker();
        if (success) {
          this.workerInitialized = true;
          this.diagnostics.initialized = true;
          
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ PDF Worker initialized successfully in ${elapsedTime}ms from ${workerSrc}`);
          return true;
        } else {
          throw new Error('Worker functionality test failed after setting workerSrc');
        }
      } catch (error) {
        const errorMsg = `Configuration ${i + 1} (${workerSrc}) failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.warn(`⚠️ ${errorMsg}`);
        this.diagnostics.errors.push(errorMsg);
      }
    }

    // If all configurations failed, enable fallback mode
    console.error('❌ All PDF worker configurations failed - enabling fallback mode');
    this.diagnostics.fallbackMode = true;
    return false;
  }

  private async testWorkerSource(workerSrc: string): Promise<boolean> {
    try {
      console.log(`🧪 Testing worker source availability: ${workerSrc}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // הגדלת Timeout
      
      const response = await fetch(workerSrc, { 
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors', // ודא טיפול ב-CORS
        cache: 'no-store' // מנע בעיות Cache במהלך בדיקה
      });
      
      clearTimeout(timeoutId);
      const available = response.ok && response.status === 200;
      console.log(`📊 Worker source test result for ${workerSrc}: ${available ? 'AVAILABLE' : 'NOT AVAILABLE'} (status: ${response.status})`);
      return available;
    } catch (error) {
      console.warn(`❌ Worker source availability test failed for ${workerSrc}:`, error);
      return false;
    }
  }

  private async testWorker(timeoutMs = 10000): Promise<boolean> { // הגדלת Timeout לבדיקת פונקציונליות
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
        setTimeout(() => reject(new Error('Worker functionality test timeout')), timeoutMs);
      });

      const pdfDoc = await Promise.race([testPromise, timeoutPromise]);
      
      if (pdfDoc && typeof pdfDoc.numPages === 'number' && pdfDoc.numPages >= 0) {
        console.log('✅ PDF Worker functionality test PASSED');
        return true;
      } else {
        throw new Error('Invalid PDF document returned from worker test or unexpected worker behavior');
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
      const source = this.diagnostics.workerSource;
      if (source.includes('pdf.worker.min.js') && source.startsWith(window.location.origin)) {
        return '✅ פעיל (מקומי)';
      } else if (source.includes('cdn.jsdelivr.net') || source.includes('unpkg.com')) {
        return '✅ פעיל (CDN)';
      }
      return `✅ פעיל (${source.substring(0, 20)}...)`;
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
    pdfjs.GlobalWorkerOptions.workerSrc = '';
    console.log('🔄 PDF Worker Manager reset completed');
  }
}

export const initializePDFWorker = async (retries = 2): Promise<boolean> => {
  const manager = PDFWorkerManager.getInstance();
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    console.log(`🚀 PDF Worker initialization attempt ${attempt}/${retries + 1}`);
    
    const success = await manager.initializeWorker();
    if (success) {
      return true;
    }
    
    if (attempt <= retries) {
      console.log(`⏳ Retrying PDF Worker initialization in 2 seconds...`); // הגדלת זמן ההמתנה לניסיון חוזר
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.warn('⚠️ PDF Worker initialization failed after all attempts - continuing in fallback mode');
  return false;
};

export default PDFWorkerManager;