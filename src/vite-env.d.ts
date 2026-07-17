/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LOWCODE_HTTP_ALLOWED_ORIGINS?: string;
  readonly VITE_PUBLISHER_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
