
import { useCallback } from 'react';
import { PDFComplexityAnalysis } from '../types/pdfViewer';

export const usePDFComplexity = () => {
  const analyzeComplexity = useCallback((fileSize: number, numPages: number = 1): PDFComplexityAnalysis => {
    // Basic heuristic analysis based on file size and page count
    const avgPageSize = fileSize / numPages;
    const sizeKB = fileSize / 1024;
    
    let estimatedComplexity: 'simple' | 'medium' | 'complex';
    let hasVectorGraphics = false;
    let hasCustomFonts = false;
    let hasLayers = false;
    let hasTransparency = false;

    // Heuristic analysis based on file size patterns
    if (avgPageSize > 500 * 1024) { // > 500KB per page
      estimatedComplexity = 'complex';
      hasVectorGraphics = true;
      hasLayers = true;
    } else if (avgPageSize > 200 * 1024) { // > 200KB per page
      estimatedComplexity = 'medium';
      hasVectorGraphics = true;
    } else {
      estimatedComplexity = 'simple';
    }

    // Additional heuristics
    if (sizeKB > 2000) { // > 2MB
      hasCustomFonts = true;
    }
    
    if (sizeKB > 5000) { // > 5MB
      hasTransparency = true;
      hasLayers = true;
    }

    console.log(`📋 PDF Complexity Analysis:`, {
      fileSize: `${Math.round(sizeKB)}KB`,
      avgPageSize: `${Math.round(avgPageSize/1024)}KB/page`,
      estimatedComplexity,
      numPages
    });

    return {
      hasVectorGraphics,
      hasCustomFonts,
      hasLayers,
      hasTransparency,
      pageCount: numPages,
      estimatedComplexity
    };
  }, []);

  const getOptimizedSettings = useCallback((complexity: PDFComplexityAnalysis) => {
    const baseSettings = {
      verbosity: 0,
      disableFontFace: false,
      disableRange: false,
      disableStream: false,
      cMapUrl: '',
      cMapPacked: false,
      standardFontDataUrl: '',
      useSystemFonts: true,
      enableXfa: false,
    };

    switch (complexity.estimatedComplexity) {
      case 'complex':
        return {
          ...baseSettings,
          maxImageSize: 1024 * 1024, // 1MB limit for complex files
          disableFontFace: true, // Disable custom fonts for performance
          renderInteractiveForms: false,
        };
      case 'medium':
        return {
          ...baseSettings,
          maxImageSize: 1024 * 1024 * 1.5, // 1.5MB limit
        };
      default:
        return {
          ...baseSettings,
          maxImageSize: 1024 * 1024 * 2, // 2MB limit for simple files
        };
    }
  }, []);

  return {
    analyzeComplexity,
    getOptimizedSettings
  };
};
