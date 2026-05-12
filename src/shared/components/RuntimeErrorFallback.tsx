import { Button, Result, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

interface RuntimeErrorFallbackProps {
  title?: ReactNode;
  description?: ReactNode;
  requestId?: string;
  homeLabel?: string;
  reloadLabel?: string;
  onHome?: () => void;
  onReload?: () => void;
}

export function RuntimeErrorFallback({
  title = '页面运行异常',
  description = '当前页面暂时无法继续渲染，请刷新页面重试，或返回首页重新进入。',
  requestId,
  homeLabel = '返回首页',
  reloadLabel = '刷新页面',
  onHome = () => window.location.assign('/'),
  onReload = () => window.location.reload(),
}: RuntimeErrorFallbackProps) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <Result
      status="error"
      title={title}
      subTitle={<Space direction="vertical" size={4}>
        <span>{description}</span>
        {requestId && <Typography.Text type="secondary">
          排障编号：<Typography.Text code>{requestId}</Typography.Text>
        </Typography.Text>}
      </Space>}
      extra={[
        <Button key="home" type="primary" onClick={onHome}>
          {homeLabel}
        </Button>,
        <Button key="reload" onClick={onReload}>
          {reloadLabel}
        </Button>,
      ]}
    />
  </div>;
}
