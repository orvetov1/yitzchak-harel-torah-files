
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
  pageNumber?: number;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class PDFErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 PDF Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      pageNumber: this.props.pageNumber,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 hebrew-text bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center space-y-4 p-6">
            <div className="text-red-600">
              <div className="text-lg font-medium">שגיאה בהצגת הדף</div>
              <div className="text-sm mt-2">
                {this.props.pageNumber ? `עמוד ${this.props.pageNumber}` : 'תוכן PDF'}
              </div>
            </div>
            <div className="text-xs text-red-500 bg-red-100 p-2 rounded font-mono">
              {this.state.error?.message || 'שגיאה לא ידועה'}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onRetry?.();
                }}
                className="hebrew-text"
              >
                נסה שוב
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PDFErrorBoundary;
