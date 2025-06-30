
export interface DocumentCache {
  [key: string]: {
    numPages: number;
    loadedAt: number;
  };
}

export interface PDFViewerState {
  numPages: number;
  pageNumber: number;
  scale: number;
  loading: boolean;
  loadingProgress: number;
  error: string | null;
  pageLoading: boolean;
  fileSize: number;
  waitingForUser: boolean;
  loadingPhase: string;
}

export interface PDFLoadingCallbacks {
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onDocumentLoadProgress: ({ loaded, total }: { loaded: number; total: number }) => void;
  setPageLoading: (loading: boolean) => void;
}
