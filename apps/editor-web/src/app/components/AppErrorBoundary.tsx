import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RuntimeErrorFallback } from '../../shared/components/RuntimeErrorFallback';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <RuntimeErrorFallback description="应用运行时发生异常，已在浏览器控制台留下错误信息。你可以返回首页重新进入。" />;
    }

    return this.props.children;
  }
}
