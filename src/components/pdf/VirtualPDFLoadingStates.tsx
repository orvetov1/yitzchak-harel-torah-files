
import React from 'react';
import { Button } from '../ui/button';

interface VirtualPDFLoadingStatesProps {
  isWorkerReady: boolean;
  workerInitializing: boolean;
  isLoading: boolean;
  fileInfo: any;
  error: string | null;
  onReload: () => void;
  onClose: () => void;
}

const VirtualPDFLoadingStates = ({
  isWorkerReady,
  workerInitializing,
  isLoading,
  fileInfo,
  error,
  onReload,
  onClose
}: VirtualPDFLoadingStatesProps) => {
  if (!isWorkerReady) {
    return <div>מאתחל מנוע PDF...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="text-red-600 mb-4 text-lg">{error}</div>
        <div className="space-y-2">
          <Button onClick={onReload} className="hebrew-text mr-2">נסה שוב</Button>
          <Button onClick={onClose} variant="outline" className="hebrew-text">סגור</Button>
        </div>
      </div>
    );
  }

  if ((isLoading && !fileInfo) || workerInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center hebrew-text p-8 bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <div>
          {workerInitializing ? 'מכין מנוע PDF...' : 'מכין את הקובץ...'}
        </div>
      </div>
    );
  }

  return null;
};

export default VirtualPDFLoadingStates;
