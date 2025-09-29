/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly TEST_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
