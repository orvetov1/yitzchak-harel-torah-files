
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  pageNumber?: number;
  pdfUrl?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class PDFErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 PDF Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      pageNumber: this.props.pageNumber,
      errorInfo,
      pdfUrl: this.props.pdfUrl
    });
    
    this.setState({ errorInfo });
  }

  private getErrorType = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('worker') || message.includes('setup')) {
      return 'worker';
    } else if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    } else if (message.includes('invalid') || message.includes('corrupt')) {
      return 'file';
    } else {
      return 'unknown';
    }
  };

  private getErrorMessage = (error: Error) => {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'worker':
        return 'בעיה בטעינת מנוע PDF - נסה לרענן את הדף';
      case 'network':
        return 'בעיית רשת - בדוק את החיבור לאינטרנט';
      case 'file':
        return 'קובץ PDF פגום או לא תקין';
      default:
        return 'שגיאה בטעינת הקובץ';
    }
  };

  private handleDownload = async () => {
    if (!this.props.pdfUrl) return;
    
    try {
      const response = await fetch(this.props.pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-page-${this.props.pageNumber || 'unknown'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(this.props.pdfUrl, '_blank');
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? this.getErrorMessage(this.state.error) : 'שגיאה לא ידועה';
      const errorType = this.state.error ? this.getErrorType(this.state.error) : 'unknown';
      
      return (
        <div className="flex items-center justify-center h-96 hebrew-text bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="text-red-600">
              <div className="text-lg font-medium">{errorMessage}</div>
              {this.props.pageNumber && (
                <div className="text-sm mt-2">
                  עמוד {this.props.pageNumber}
                </div>
              )}
            </div>
            
            <div className="text-xs text-red-500 bg-red-100 p-2 rounded font-mono">
              {this.state.error?.message || 'שגיאה לא ידועה'}
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  this.props.onRetry?.();
                }}
                className="hebrew-text"
              >
                <RefreshCw size={16} className="ml-2" />
                נסה שוב
              </Button>
              
              {this.props.pdfUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleDownload}
                    className="hebrew-text"
                  >
                    <Download size={16} className="ml-2" />
                    הורד קובץ
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(this.props.pdfUrl, '_blank')}
                    className="hebrew-text"
                  >
                    <ExternalLink size={16} className="ml-2" />
                    פתח בטאב חדש
                  </Button>
                </>
              )}
            </div>
            
            {errorType === 'worker' && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                רענון הדף עשוי לפתור את הבעיה
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PDFErrorBoundary;
