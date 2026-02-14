import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.pageName ?? 'Page'}] error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="max-w-4xl mx-auto p-8 min-h-screen bg-bg text-fg">
          <h1 className="text-2xl font-semibold mb-4 text-red-500">
            Something went wrong{this.props.pageName ? ` on ${this.props.pageName}` : ''}
          </h1>
          <pre className="whitespace-pre-wrap break-words mb-4 text-sm text-muted">
            {this.state.error.toString()}
          </pre>
          <p className="mb-4 text-muted">Check the browser console (F12) for details.</p>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-lg border border-accent bg-input hover:border-accent-hover text-fg"
            >
              Try again
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent/10"
            >
              Go home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
