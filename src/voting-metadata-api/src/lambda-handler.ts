import { SecretsManager } from 'aws-sdk'
import serverless from 'serverless-http'
import { app } from './app'
import { AwsSecretsService } from './services/awsSecretsService'


const init = async () => {
  const load = Object.keys(process.env)
    .filter((key) => key.match(/_ARN$/))
    .map(async (key) => {
      console.log(`Fetching secret with a key : ${key}`)
      let arn = process.env[key] as string
      const secretsClient = new SecretsManager({
        region: process.env.AWS_REGION,
      })
      const secretsService = new AwsSecretsService(secretsClient)
      process.env[key.replace(/_ARN$/, '')] = await secretsService.getSecret(arn)
    })

  await Promise.all(load)
}

export const handler = serverless(app)
