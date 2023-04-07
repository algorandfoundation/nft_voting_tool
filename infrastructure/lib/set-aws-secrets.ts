#!/usr/bin/env node
/* eslint-disable node/shebang */
// You can't set secrets securely without the value leaking in CloudFormation
// This script allows us to output SecretsManager::Secret ARNs by convention
//  and the values populated.

import { PutSecretValueCommandOutput, PutSecretValueResponse, SecretsManager } from '@aws-sdk/client-secrets-manager'
import { readFileSync } from 'fs'

const client = new SecretsManager({
  region: process.env.AWS_DEFAULT_REGION,
})

// Once CloudFormation runs all outputs are written to cdk-outputs.json
const cfnOutputBuffer = readFileSync('./cdk-outputs.json')
const cfnOutputJson = cfnOutputBuffer.toString()
const cfnOutputs = JSON.parse(cfnOutputJson) as Record<string, Record<string, string>>

// Pull out any CloudFormation outputs that end in "SECRETARN"
const outputs: { arn: string; environmentKey: string }[] = []
Object.keys(cfnOutputs).forEach((stackKey) => {
  Object.keys(cfnOutputs[stackKey])
    .filter((outputKey) => {
      return /secretarn$/i.test(outputKey)
    })
    .forEach((outputKey) => {
      outputs.push(JSON.parse(cfnOutputs[stackKey][outputKey]) as { arn: string; environmentKey: string })
    })
})

// The format of the CloudFormation output should be a string with JSON of format: {arn: 'arn of secret', environmentKey: 'environment variable key of the secret value'}
const setSecretsResults = outputs.map((output) => {
  return new Promise<PutSecretValueResponse | null>((resolve, reject) => {
    if (!process.env[output.environmentKey]) {
      resolve(null)
      return
    }

    client.putSecretValue({ SecretId: output.arn, SecretString: process.env[output.environmentKey] }, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data!)
    })
  })
})

void (async () => {
  await Promise.all(setSecretsResults).then(
    (successes) => {
      successes
        .filter((s) => s !== null)
        .map((s) => s as PutSecretValueCommandOutput)
        .forEach((success: PutSecretValueCommandOutput) => {
          console.log(`Secret set for ${success.Name ?? ''} with version ${success.VersionId ?? ''}`)
        })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (failures: any) => {
      if (failures instanceof Array) {
        failures.forEach((failure: any) => {
          console.error(`Secret set FAILED: ${JSON.stringify(failure)}}`)
        })
        throw 'Failed'
      } else {
        throw failures
      }
    },
  )
})()
