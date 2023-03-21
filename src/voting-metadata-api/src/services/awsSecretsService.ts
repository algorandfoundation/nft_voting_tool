import { SecretsManager } from 'aws-sdk'
import { inject, registry, singleton } from 'tsyringe'

@singleton()
@registry([
  {
    token: SecretsManager,
    useFactory: (c) => {
      return new SecretsManager({
        region: process.env.AWS_REGION
      })
    }
  }
])
export class AwsSecretsService {
  private secretsClient: SecretsManager

  constructor(@inject(SecretsManager) secretsClient: SecretsManager) {
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
}