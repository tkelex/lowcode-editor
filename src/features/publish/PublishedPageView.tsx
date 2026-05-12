import { Spin } from 'antd';
import { isAxiosError } from 'axios';
import { Component as ReactComponent, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { migratePageSchema } from '../../../packages/lowcode-schema/src';
import { RuntimeErrorFallback } from '../../shared/components/RuntimeErrorFallback';
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
      return <RuntimeErrorFallback description="发布页渲染失败，请刷新页面重试，或返回首页重新进入。" />;
    }

    return this.props.children;
  }
}

export function PublishedPageView({ publicId }: PublishedPageViewProps) {
  const [page, setPage] = useState<PublishedPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [loadRequestId, setLoadRequestId] = useState('');

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setLoadRequestId('');
    setPage(null);

    getPublishedPage(publicId)
      .then((data) => {
        setPage(data);
      })
      .catch((error: unknown) => {
        console.error('Published page load failed', error);
        setLoadRequestId(getApiRequestId(error));
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [publicId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;
  }

  if (failed || !page) {
    return <RuntimeErrorFallback
      title="页面不存在或已取消发布"
      description="请确认公开链接仍然有效，或返回首页重新进入。"
      requestId={loadRequestId}
    />;
  }

  let components: Component[];

  try {
    const schema = migratePageSchema(page.schema);
    components = schema.components as Component[];
  } catch (error) {
    console.error('Published page schema migration failed', error);
    return <RuntimeErrorFallback title="页面数据异常" description="发布快照无法正常解析，请联系管理员重新发布页面。" />;
  }

  const pageProps = components[0]?.name === 'Page' ? components[0].props || {} : {};
  const seoTitle = getTextMeta(pageProps.seoTitle) || page.name;
  const seoDescription = getTextMeta(pageProps.seoDescription);
  const favicon = getTextMeta(pageProps.favicon);

  return <PublishedPageErrorBoundary>
    <PublishedPageSeo title={seoTitle} description={seoDescription} favicon={favicon} />
    <div className="min-h-screen bg-slate-50">
      <Preview components={components} allowCustomJS={false} />
    </div>
  </PublishedPageErrorBoundary>;
}

function PublishedPageSeo({ title, description, favicon }: { title: string; description?: string; favicon?: string }) {
  useEffect(() => {
    document.title = title;

    const descriptionMeta = ensureMetaDescription();
    const previousDescription = descriptionMeta.getAttribute('content') || '';
    if (description) {
      descriptionMeta.setAttribute('content', description);
    } else {
      descriptionMeta.removeAttribute('content');
    }

    const faviconLink = ensureFaviconLink();
    const previousFavicon = faviconLink.getAttribute('href') || '';
    if (favicon) {
      faviconLink.setAttribute('href', favicon);
    } else {
      faviconLink.removeAttribute('href');
    }

    return () => {
      restoreOptionalAttribute(descriptionMeta, 'content', previousDescription);
      restoreOptionalAttribute(faviconLink, 'href', previousFavicon);
    };
  }, [description, favicon, title]);

  return null;
}

function ensureMetaDescription() {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }

  return meta;
}

function ensureFaviconLink() {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    document.head.appendChild(link);
  }

  return link;
}

function getTextMeta(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getApiRequestId(error: unknown) {
  if (!isAxiosError(error)) {
    return '';
  }

  const data = error.response?.data;
  if (!data || typeof data !== 'object' || !('requestId' in data)) {
    return '';
  }

  const requestId = (data as { requestId?: unknown }).requestId;
  return typeof requestId === 'string' ? requestId : '';
}

function restoreOptionalAttribute(element: Element, name: string, value: string) {
  if (value) {
    element.setAttribute(name, value);
  } else {
    element.removeAttribute(name);
  }
}
