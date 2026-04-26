import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export default class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.errorMessage ?? 'An unexpected error occurred.'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
