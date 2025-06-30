
import { useRef, useCallback } from 'react';

export const usePDFProgressSimulation = () => {
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulationStartTime = useRef<number>(0);

  const startProgressSimulation = useCallback((
    setLoadingProgress: (progress: number) => void,
    setLoadingPhase: (phase: string) => void
  ) => {
    let progress = 0;
    let step = 0;
    simulationStartTime.current = Date.now();
    
    const updateProgress = () => {
      step++;
      const elapsedSeconds = (Date.now() - simulationStartTime.current) / 1000;
      
      // More realistic progression based on time
      if (elapsedSeconds < 2) {
        progress = Math.min(progress + 8, 25); // Fast start to 25%
        setLoadingPhase('מתחיל הורדה...');
      } else if (elapsedSeconds < 5) {
        progress = Math.min(progress + 5, 50); // Steady to 50%
        setLoadingPhase('מוריד תוכן...');
      } else if (elapsedSeconds < 8) {
        progress = Math.min(progress + 3, 70); // Slower to 70%
        setLoadingPhase('מעבד נתונים...');
      } else if (elapsedSeconds < 12) {
        progress = Math.min(progress + 2, 85); // Even slower to 85%
        setLoadingPhase('מכין לתצוגה...');
      } else {
        progress = Math.min(progress + 0.5, 90); // Very slow crawl to 90%
        setLoadingPhase('מסיים עיבוד...');
      }
      
      if (progress > 90) {
        progress = 90; // Cap at 90% to leave room for real progress
      }
      
      setLoadingProgress(progress);
      console.log(`📈 Simulated progress: ${Math.round(progress)}% after ${elapsedSeconds.toFixed(1)}s`);
      
      if (progress < 90 && elapsedSeconds < 15) {
        progressIntervalRef.current = setTimeout(updateProgress, 800); // Slower, more realistic updates
      }
    };
    
    // Start simulation immediately
    updateProgress();
  }, []);

  const clearProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearTimeout(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  return {
    startProgressSimulation,
    clearProgressSimulation
  };
};
