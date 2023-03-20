import { SecretsManager } from 'aws-sdk'

export async function getSecret(secretArn: string): Promise<string> {
  var client = new SecretsManager({
    // This is automatically specified with in the Lambda runtime environment
    //  https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
    region: process.env.AWS_REGION,
  })

  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretArn }, (err, data) => {
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
