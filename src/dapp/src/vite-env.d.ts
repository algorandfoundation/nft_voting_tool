/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALGOD_NODE_CONFIG_TOKEN: string;
  readonly VITE_ALGOD_NODE_CONFIG_SERVER: string;
  readonly VITE_ALGOD_NOTE_CONFIG_PORT: string;
  readonly VITE_ALGOD_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
