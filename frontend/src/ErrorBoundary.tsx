import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="p-8 font-sans text-red-500 bg-neutral-900 min-h-screen">
          <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
          <pre className="whitespace-pre-wrap break-words mb-4">{this.state.error.toString()}</pre>
          <p className="mb-4">Check the browser console (F12) for details.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-[#646cff] bg-neutral-800 hover:border-[#535bf2] cursor-pointer"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
