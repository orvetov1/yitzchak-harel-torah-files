
import { useState, useEffect } from 'react';
import { ensurePDFWorkerReady } from '../../../utils/pdfWorkerAutoInitializer';

export const usePDFWorkerInitialization = () => {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerInitializing, setWorkerInitializing] = useState(false);

  // Check if PDF Worker is ready
  useEffect(() => {
    const checkWorker = async () => {
      const { isPDFWorkerReady } = await import('../../../utils/pdfWorkerLoader');
      const ready = await isPDFWorkerReady();
      setIsWorkerReady(ready);
    };
    
    checkWorker();
  }, []);

  // Auto-initialize PDF Worker when container opens
  useEffect(() => {
    const initializeWorker = async () => {
      setWorkerInitializing(true);
      try {
        await ensurePDFWorkerReady();
      } catch (error) {
        console.error('❌ Failed to initialize PDF Worker:', error);
      } finally {
        setWorkerInitializing(false);
      }
    };

    initializeWorker();
  }, []);

  return {
    isWorkerReady,
    workerInitializing
  };
};
