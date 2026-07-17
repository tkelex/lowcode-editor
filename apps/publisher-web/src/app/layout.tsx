import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '低代码发布页',
  description: '低代码平台公开发布页面',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
