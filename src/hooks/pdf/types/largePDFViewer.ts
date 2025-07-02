
export interface PDFPage {
  id: string;
  pageNumber: number;
  filePath: string;
  fileSize: number;
}

export interface PDFFileInfo {
  id: string;
  title: string;
  numPagesTotal: number | null;
  processingStatus: string;
}

export interface LargePDFViewerState {
  currentPage: number;
  scale: number;
  visiblePages: number[];
  loadedPages: Map<number, PDFPage>;
  loadingPages: Set<number>;
  errorPages: Set<number>;
  totalPages: number;
}

export const PRELOAD_DISTANCE = 3;
export const MAX_LOADED_PAGES = 20;
