import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    const { children, fallback: Fallback } = this.props;
    const { hasError, error } = this.state;

    if (hasError && error) {
      if (Fallback) {
        return <Fallback error={error} />;
      }

      return (
        <div className="error-boundary" data-testid="error-message">
          <h2>Something went wrong</h2>
          <pre data-testid="error-details">
            {error.message}
          </pre>
        </div>
      );
    }

    return children;
  }
}
