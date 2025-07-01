
import { useState, useCallback } from 'react';

export const usePDFLoadingState = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<number>(0);
  const [waitingForUser, setWaitingForUser] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<'downloading' | 'processing' | 'rendering' | 'complete'>('downloading');

  const resetLoadingState = useCallback(() => {
    setLoading(true);
    setLoadingProgress(0);
    setError(null);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('downloading');
  }, []);

  const setLoadingSuccess = useCallback(() => {
    setLoading(false);
    setLoadingProgress(100);
    setError(null);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('complete');
  }, []);

  const setLoadingError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
    setLoadingProgress(0);
    setWaitingForUser(false);
    setLoadingPhase('');
    setLoadingStage('downloading');
  }, []);

  return {
    loading,
    loadingProgress,
    error,
    pageLoading,
    fileSize,
    waitingForUser,
    loadingPhase,
    loadingStage,
    setLoading,
    setLoadingProgress,
    setError,
    setPageLoading,
    setFileSize,
    setWaitingForUser,
    setLoadingPhase,
    setLoadingStage,
    resetLoadingState,
    setLoadingSuccess,
    setLoadingError
  };
};
