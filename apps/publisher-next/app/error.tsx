'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-[560px] rounded-[8px] border border-red-200 bg-white p-6 shadow-sm">
        <p className="m-0 text-[13px] font-medium text-red-500">发布页渲染失败</p>
        <h1 className="m-0 mt-2 text-[22px] font-semibold text-slate-950">页面暂时无法打开</h1>
        <p className="m-0 mt-3 text-[14px] leading-6 text-slate-600">
          请稍后刷新重试。如果问题持续存在，请联系页面维护者重新发布。
        </p>
        {error.digest && <p className="m-0 mt-3 text-[12px] text-slate-400">错误编号：{error.digest}</p>}
        <button
          className="mt-5 rounded-[6px] bg-blue-600 px-4 py-2 text-[14px] font-medium text-white"
          type="button"
          onClick={reset}
        >
          重试
        </button>
      </section>
    </main>
  );
}
