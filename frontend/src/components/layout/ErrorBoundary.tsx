import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected render error' };
  }

  componentDidCatch(error: Error) {
    console.error('[ClaimNexus] page error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pt-20 px-6 max-w-3xl mx-auto">
          <div className="bg-[#15201A] border border-[#B44C43]/50 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-mono font-bold text-[#B44C43] uppercase">
              {this.props.fallbackTitle || 'This view failed to render'}
            </h2>
            <p className="text-xs text-[#E5DED0]">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-3 py-1.5 rounded bg-[#B46A45] text-white text-xs font-mono"
            >
              RETRY VIEW
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
