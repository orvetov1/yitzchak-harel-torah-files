
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
import App from './App.tsx';
import './index.css';

import './utils/pdfWorkerLoader'; // Initialize optimized PDF worker

const initializePDF = async () => {
  try {
    const { initializePDFWorkerIfNeeded } = await import('./utils/pdfWorkerLoader');
    await initializePDFWorkerIfNeeded();
    console.log('PDF Worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PDF Worker:', error);
  }
};

initializePDF();

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
