'use client';

import { PageRuntime } from '../PageRuntime';
import type { RuntimeComponent, RuntimePolicy } from '../types';
import {
  preparePublishedPageSnapshot,
  type PublishedPageSnapshot,
} from './snapshot';

export interface PublishedPageRuntimeProps {
  snapshot: PublishedPageSnapshot;
  apiBaseUrl: string;
  allowedOrigins: string[];
  onError?: RuntimePolicy['onError'];
}

export function PublishedPageRuntime({
  snapshot,
  apiBaseUrl,
  allowedOrigins,
  onError,
}: PublishedPageRuntimeProps) {
  const prepared = preparePublishedPageSnapshot(snapshot);

  return <PageRuntime
    components={prepared.schema.components as RuntimeComponent[]}
    policy={{
      apiBaseUrl,
      allowedOrigins,
      getAuthToken: () => undefined,
      allowCustomJS: false,
      onError,
    }}
  />;
}
