import { Button, Result, Spin } from 'antd';
import { Component as ReactComponent, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { migratePageSchema } from '../../../packages/lowcode-schema/src';
import { Component } from '../../editor/stores/components';
import { Preview } from '../../editor/runtime/Preview';
import { getPublishedPage } from '../../shared/api/pages';
import { PublishedPage } from '../../shared/api/types';

interface PublishedPageViewProps {
  publicId: string;
}

interface PublishedPageErrorBoundaryProps {
  children: ReactNode;
}

interface PublishedPageErrorBoundaryState {
  hasError: boolean;
}

class PublishedPageErrorBoundary extends ReactComponent<
  PublishedPageErrorBoundaryProps,
  PublishedPageErrorBoundaryState
> {
  state: PublishedPageErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Published page render failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <PublishedPageErrorFallback />;
    }

    return this.props.children;
  }
}

export function PublishedPageView({ publicId }: PublishedPageViewProps) {
  const [page, setPage] = useState<PublishedPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPublishedPage(publicId)
      .then((data) => {
        setPage(data);
        document.title = data.name;
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;
  }

  if (failed || !page) {
    return <PublishedPageErrorFallback title="页面不存在或已取消发布" />;
  }

  let components: Component[];

  try {
    const schema = migratePageSchema(page.schema);
    components = schema.components as Component[];
  } catch (error) {
    console.error('Published page schema migration failed', error);
    return <PublishedPageErrorFallback title="页面数据异常" />;
  }

  return <PublishedPageErrorBoundary>
    <div className="min-h-screen bg-slate-50">
      <Preview components={components} allowCustomJS={false} />
    </div>
  </PublishedPageErrorBoundary>;
}

function PublishedPageErrorFallback({ title = '页面运行异常' }: { title?: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <Result
      status="error"
      title={title}
      subTitle="请刷新页面重试，或返回首页重新进入。"
      extra={[
        <Button key="home" type="primary" onClick={() => { window.location.href = '/'; }}>
          返回首页
        </Button>,
        <Button key="reload" onClick={() => window.location.reload()}>
          刷新页面
        </Button>,
      ]}
    />
  </div>;
}
