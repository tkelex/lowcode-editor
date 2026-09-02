declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    alternates?: {
      canonical?: string;
    };
    icons?: {
      icon?: string;
    };
    openGraph?: {
      title?: string;
      description?: string;
      url?: string;
      type?: string;
      siteName?: string;
    };
  }

  export namespace MetadataRoute {
    export interface Robots {
      rules: {
        userAgent: string;
        allow?: string;
        disallow?: string;
      };
      sitemap?: string;
    }

    export type Sitemap = Array<{
      url: string;
      lastModified?: Date;
    }>;
  }
}

declare module 'next/cache' {
  export function revalidateTag(tag: string): void;
}

declare module 'next/link' {
  import type { AnchorHTMLAttributes, ReactNode } from 'react';

  export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: ReactNode;
  }): ReactNode;
}

declare module 'next/navigation' {
  export function notFound(): never;
}

declare module 'next/server' {
  export class NextResponse {
    static json(body: unknown, init?: { status?: number }): Response;
  }
}

declare const process: {
  env: Record<string, string | undefined>;
};

interface ImportMeta {
  readonly env?: Record<string, string | undefined>;
}
