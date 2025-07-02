
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { pdfjs } from 'react-pdf';
import App from './App.tsx';
import './index.css';

// Initialize PDF Worker automatically on app startup
console.log('🚀 Starting PDF.js initialization...');
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

// Test worker availability immediately
const testWorkerAvailability = async () => {
  try {
    console.log('🧪 Testing PDF Worker availability...');
    
    // Create a minimal test PDF for verification
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
      verbosity: 1
    }).promise;
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Worker test timeout')), 3000);
    });

    const pdfDoc = await Promise.race([testPromise, timeoutPromise]);
    
    if (pdfDoc && typeof pdfDoc.numPages === 'number') {
      console.log('✅ PDF Worker is working correctly!');
      return true;
    } else {
      throw new Error('Invalid response from worker');
    }
  } catch (error) {
    console.error('❌ PDF Worker test failed:', error);
    return false;
  }
};

// Test worker on startup
testWorkerAvailability().then(isWorking => {
  if (isWorking) {
    console.log('✅ PDF Worker initialized and tested successfully');
  } else {
    console.warn('⚠️ PDF Worker may have issues - check console for details');
  }
});

// Enhanced QueryClient configuration for PDF handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry PDF worker errors
        if (error?.message?.includes('worker') || error?.message?.includes('PDF')) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
