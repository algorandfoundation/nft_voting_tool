/// <reference types="vite/client" />

interface ImportMetaEnv {
<<<<<<< HEAD
  readonly VITE_ALGOD_NODE_CONFIG_TOKEN: string;
  readonly VITE_ALGOD_NODE_CONFIG_SERVER: string;
  readonly VITE_ALGOD_NODE_CONFIG_PORT: string;
  readonly VITE_INDEXER_SERVER: string;
  readonly VITE_INDEXER_PORT: string;
  readonly VITE_INDEXER_TOKEN: string;
  readonly VITE_ALGOD_NETWORK: string;
=======
  readonly VITE_ALGOD_NODE_CONFIG_TOKEN: string
  readonly VITE_ALGOD_NODE_CONFIG_SERVER: string
  readonly VITE_ALGOD_NOTE_CONFIG_PORT: string
  readonly VITE_ALGOD_NETWORK: string
>>>>>>> main
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
