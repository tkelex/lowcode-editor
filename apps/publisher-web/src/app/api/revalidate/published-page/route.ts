import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { createPublishedPageTag, getPublisherRuntimeConfig } from '@/published-pages/config';

export async function POST(request: Request) {
  const config = getPublisherRuntimeConfig();
  const secret = request.headers.get('x-revalidate-secret') || '';

  if (!config.revalidateSecret || secret !== config.revalidateSecret) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await safeReadJson(request);
  const publicId = typeof body.publicId === 'string' ? body.publicId.trim() : '';

  if (!publicId) {
    return NextResponse.json({ ok: false, message: 'publicId is required' }, { status: 400 });
  }

  revalidateTag(createPublishedPageTag(publicId));

  return NextResponse.json({
    ok: true,
    publicId,
    tag: createPublishedPageTag(publicId),
  });
}

async function safeReadJson(request: Request) {
  try {
    return await request.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}
