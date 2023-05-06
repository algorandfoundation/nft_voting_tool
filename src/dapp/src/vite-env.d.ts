/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALGOD_NODE_CONFIG_TOKEN: string
  readonly VITE_ALGOD_NODE_CONFIG_SERVER: string
  readonly VITE_ALGOD_NODE_CONFIG_PORT: string
  readonly VITE_INDEXER_SERVER: string
  readonly VITE_INDEXER_PORT: string
  readonly VITE_INDEXER_TOKEN: string
  readonly VITE_ALGOD_NETWORK: string
  readonly VITE_ENVIRONMENT: string
  readonly VITE_IPFS_GATEWAY_URL: string
  readonly VITE_ALGO_EXPLORER_URL: string
  readonly VITE_NFT_EXPLORER_URL: string
  readonly VITE_IS_TESTNET: string
  readonly VITE_CREATOR_ALLOW_LIST: string
  readonly VITE_HIDDEN_VOTING_ROUND_IDS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
