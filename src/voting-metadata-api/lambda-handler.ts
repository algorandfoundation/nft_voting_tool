import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import AWS, { S3 } from 'aws-sdk'
import * as xrayClient from 'aws-xray-sdk'
import http from 'http'
import https from 'https'
import { Web3Storage } from 'web3.storage'
import { getSecret } from './functions/aws'
import { S3ObjectCache } from './functions/cache'
import { Web3StorageWithCache } from './functions/web3-storage'

const init = (async () => {
  const load = Object.keys(process.env)
    .filter((key) => key.match(/_ARN$/))
    .map(async (key) => {
      console.log(`Fetching secret with a key : ${key}`)
      process.env[key.replace(/_ARN$/, '')] = await getSecret(process.env[key] as string)
    })

  await Promise.all(load)

  const ipfs = new Web3StorageWithCache(
    new Web3Storage({ token: process.env.WEB3_STORAGE_API_TOKEN! }),
    new S3ObjectCache(
      new S3({
        region: process.env.AWS_REGION,
      }),
      process.env.CACHE_BUCKET_NAME!
    )
  )
  return { ipfs }
})()

export const handler: APIGatewayProxyHandlerV2 = async (): Promise<APIGatewayProxyResultV2<never>> => {
  xrayClient.enableAutomaticMode()
  xrayClient.captureAWS(AWS)
  xrayClient.captureHTTPsGlobal(http)
  xrayClient.captureHTTPsGlobal(https)
  xrayClient.capturePromise()

  const { ipfs } = await init

  return {
    statusCode: 201,
    body: JSON.stringify({
      "Hello": "World"
    }),
  }
}
