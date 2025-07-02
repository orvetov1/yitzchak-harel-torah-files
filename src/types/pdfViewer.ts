
export interface DocumentCache {
  [key: string]: {
    numPages: number;
    loadedAt: number;
    complexity?: 'simple' | 'complex' | 'unknown';
    loadTime?: number;
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
  loadingStage: 'downloading' | 'processing' | 'rendering' | 'complete';
  processingStartTime: number;
  downloadStartTime: number;
}

export interface PDFLoadingCallbacks {
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onDocumentLoadProgress: ({ loaded, total }: { loaded: number; total: number }) => void;
  setPageLoading: (loading: boolean) => void;
}

export interface PDFComplexityAnalysis {
  hasVectorGraphics: boolean;
  hasCustomFonts: boolean;
  hasLayers: boolean;
  hasTransparency: boolean;
  pageCount: number;
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}

export interface PDFPerformanceMetrics {
  downloadTime: number;
  processingTime: number;
  totalTime: number;
  fileSize: number;
  complexity: string;
  success: boolean;
  errorType?: string;
}

export interface PDFPageData {
  file_path: string;
  page_number: number;
}
