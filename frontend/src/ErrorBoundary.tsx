import { Component, ErrorInfo, ReactNode } from 'react';

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
        <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#e74c3c', background: '#1a1a1a', minHeight: '100vh' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error.toString()}</pre>
          <p>Check the browser console (F12) for details.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
