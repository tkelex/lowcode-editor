import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-[640px] rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="m-0 text-[13px] font-medium text-blue-600">Lowcode Publisher</p>
        <h1 className="m-0 mt-2 text-[24px] font-semibold text-slate-950">Next.js 公开发布页运行时</h1>
        <p className="m-0 mt-3 text-[14px] leading-6 text-slate-600">
          请通过低代码平台发布后生成的公开链接访问页面。
        </p>
        <Link className="mt-5 inline-flex text-[14px] font-medium text-blue-600" href="/publish/demo">
          查看示例路径格式
        </Link>
      </section>
    </main>
  );
}
