/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_PUBLIC_URL?: string
  readonly VITE_OS_API_BASE?: string
  readonly VITE_OS_IMPORT_TOKEN?: string
  readonly VITE_LAB_REMOTE_SYNC?: string
  readonly VITE_OS_SUITE_URL?: string
  readonly VITE_OPS_SUITE_URL?: string
  readonly VITE_LAB_SUITE_URL?: string
  readonly VITE_FLOW_SUITE_URL?: string
  readonly VITE_CONNECT_SUITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
