import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
        path?: string;
      };
      if (parsed && parsed.error) {
        readable = `Database permission or sync issue (${parsed.operationType || 'read'} ${parsed.path || ''}): ${parsed.error}`;
      }
    } catch {
      // Keep original error message
    }
    return {
      hasError: true,
      message: readable,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('StudyCommons ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA] p-4">
          <div className="max-w-md w-full heritage-card border rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="w-5 h-5 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold">
                  Something interrupted StudyCommons
                </h1>
                <p className="mt-1.5 text-xs text-[#574F45] dark:text-[#CEC5B6] leading-relaxed break-words">
                  {this.state.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reload StudyCommons</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
