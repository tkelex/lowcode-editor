import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-[520px] rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="m-0 text-[13px] font-medium text-slate-500">404</p>
        <h1 className="m-0 mt-2 text-[24px] font-semibold text-slate-950">页面不存在或已取消发布</h1>
        <p className="m-0 mt-3 text-[14px] leading-6 text-slate-600">
          请确认公开链接仍然有效，或联系页面维护者重新发布。
        </p>
        <Link className="mt-5 inline-flex text-[14px] font-medium text-blue-600" href="/">
          返回首页
        </Link>
      </section>
    </main>
  );
}
