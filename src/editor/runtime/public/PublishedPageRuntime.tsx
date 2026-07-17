'use client';

import type { Component } from '../../stores/components';
import { Preview } from '../Preview';
import {
  preparePublishedPageSnapshot,
  type PublishedPageSnapshot,
} from './snapshot';

export interface PublishedPageRuntimeProps {
  snapshot: PublishedPageSnapshot;
  apiBaseUrl: string;
  allowedOrigins: string[];
}

export function PublishedPageRuntime({
  snapshot,
  apiBaseUrl,
  allowedOrigins,
}: PublishedPageRuntimeProps) {
  const prepared = preparePublishedPageSnapshot(snapshot);

  return <Preview
    components={prepared.schema.components as Component[]}
    allowCustomJS={false}
    runtimeConfig={{
      apiBaseUrl,
      allowedOrigins,
      getAuthToken: () => undefined,
    }}
  />;
}
