'use client';

import { Preview } from '../../../../src/editor/runtime/Preview';
import type { Component } from '../../../../src/editor/stores/components';

export interface PublishedPageRuntimeProps {
  components: Component[];
  apiBaseUrl: string;
  allowedOrigins: string[];
}

export function PublishedPageRuntime({
  components,
  apiBaseUrl,
  allowedOrigins,
}: PublishedPageRuntimeProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Preview
        components={components}
        allowCustomJS={false}
        runtimeConfig={{
          apiBaseUrl,
          allowedOrigins,
          getAuthToken: () => undefined,
        }}
      />
    </div>
  );
}
