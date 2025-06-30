
import { useRef, useCallback } from 'react';

export const usePDFProgressSimulation = () => {
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgressSimulation = useCallback((
    setLoadingProgress: (progress: number) => void,
    setLoadingPhase: (phase: string) => void
  ) => {
    let progress = 0;
    let step = 0;
    
    const updateProgress = () => {
      step++;
      
      // More realistic simulation - slower and stops at 90%
      if (step <= 3) {
        progress += 15; // 0->45% in first 3 steps (1.5s)
      } else if (step <= 6) {
        progress += 10; // 45->75% in next 3 steps (1.5s)
      } else if (step <= 10) {
        progress += 3; // 75->87% in next 4 steps (2s)
      } else {
        progress += 0.5; // Slow crawl to 90% max
      }
      
      if (progress > 90) {
        progress = 90; // Cap at 90% to leave room for real progress
      }
      
      setLoadingProgress(progress);
      
      // Update phase based on simulated progress
      if (progress < 30) {
        setLoadingPhase('מוריד קובץ...');
      } else if (progress < 70) {
        setLoadingPhase('מעבד תוכן...');
      } else {
        setLoadingPhase('מסיים עיבוד...');
      }
      
      console.log(`📈 Simulated progress: ${Math.round(progress)}%`);
      
      if (progress < 90) {
        progressIntervalRef.current = setTimeout(updateProgress, 500); // Slower simulation
      }
    };
    
    // Start simulation after a brief delay
    progressIntervalRef.current = setTimeout(updateProgress, 200);
  }, []);

  const clearProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  return {
    startProgressSimulation,
    clearProgressSimulation
  };
};
