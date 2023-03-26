import { SecretsManager } from 'aws-sdk'
import { inject, singleton } from 'tsyringe'

@singleton()
export class AwsSecretsService {
  private secretsClient: SecretsManager

  constructor(@inject("SecretsManager") secretsClient: SecretsManager) {
    this.secretsClient = secretsClient
  }

  public async getSecret(secretArn: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.secretsClient.getSecretValue({ SecretId: secretArn }, (err, data) => {
        if (err) {
          console.log(JSON.stringify(err))
          reject(err)
          return
        }

        if ('SecretString' in data) {
          resolve(data.SecretString as string)
        } else {
          resolve(Buffer.from(data.SecretBinary as any, 'base64').toString('ascii'))
        }
      })
    })
  }

  public resolveSecrets(): void {
    Object.keys(process.env)
      .filter((key) => key.match(/_ARN$/))
      .map(async (key) => {
        console.log(`Fetching secret with a key : ${key}`)
        let arn = process.env[key] as string
        process.env[key.replace(/_ARN$/, '')] = await this.getSecret(arn)
      })
  }
}