export const DEFAULT_REGION = 'us-west-1'
export const DEFAULT_CACHE_BUCKET = 'nft-voting-tool-api-developer-cache'
export const CACHE_BUCKET_NAME = process.env.CACHE_BUCKET_NAME || DEFAULT_CACHE_BUCKET
export const AWS_REGION = process.env.AWS_REGION || DEFAULT_REGION
export const IPFS_API_TOKEN = process.env.IPFS_API_TOKEN
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Assert that the ENV is in a valid configuration
 */
export function assertValidEnv() {
  if (typeof process.env.ALLOWED_ADDRESSES !== 'string') {
    throw new Error('Must have valid ALLOWED_ADDRESS list!')
  }
  if (typeof process.env.IPFS_API_TOKEN === 'undefined') {
    throw new Error('Must have valid IPFS_API_TOKEN!')
  }
  if (!isDevelopment) {
    if (typeof process.env.AWS_ACCESS_KEY_ID === 'undefined' || typeof process.env.AWS_ACCESS_KEY_SECRET === 'undefined') {
      throw new Error('Must have valid AWS_ACCESS_KEY_ID and AWS_ACCESS_KEY_SECRET')
    }

    if (typeof process.env.AWS_REGION === 'undefined') {
      console.warn(`AWS_REGION is not set, using default region ${DEFAULT_REGION}`)
    }

    if (typeof process.env.DEFAULT_CACHE_BUCKET === 'undefined') {
      console.warn(`DEFAULT_CACHE_BUCKET is not set, using default bucket ${DEFAULT_CACHE_BUCKET}`)
    }
  }
}
