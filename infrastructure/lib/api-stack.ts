import * as cdk from 'aws-cdk-lib'
import { Duration } from 'aws-cdk-lib'
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'
import { EndpointType } from 'aws-cdk-lib/aws-apigateway'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import * as fs from 'fs'
import * as path from 'path'
import { CustomDomain, CustomDomainConfig, CustomDomainConfigProps } from './custom-domain'
import { execNpm } from './exec-npm'

export interface ApiStackProps extends cdk.StackProps {
  PROXY_PATH?: string

  // Custom domain
  customDomain?: CustomDomainConfigProps

  // Files
  /** The folder to the built app files e.g. `path.join(__dirname, '..', '..', 'api', 'build')`; note: expects a src/lambda-handler.js file as the entry point within that folder */
  apiBuildFolder: string
  /** The npm script command to build the api if the api files aren't built, set `process.env.NO_BUILD` to `true` to disable this feature */
  apiNpmBuildCommand: string

  // Environment
  /** Any environment variables to populate on the deployed site */
  envVars: Record<string, string>
  /** The names of any secrets that should be created in AWS Secrets Manager and the ARN populated in `env.{SECRET_NAME}_ARN` in the deployed site */
  secretNames?: string[]

  // Operations
  /** What should the timeout be for server-side calls; default: 60 seconds */
  timeout?: cdk.Duration
  /** How much memory should be allocated; default: 256 MB */
  memorySize?: number
}

/** Deploys an API with AWS Lambda */
export class ApiStack extends cdk.Stack {
  public readonly apiLambda: lambda.Function

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    /*****************/
    // Defaults
    /*****************/
    if (!props.timeout) {
      props.timeout = Duration.seconds(60)
    }
    if (!props.memorySize) {
      props.memorySize = 256
    }

    /*****************/
    // Prep build directory
    /*****************/
    // If there is no `build` directory for the code target (e.g. if running locally) then generate it so there is code to deploy
    const appBuildPath = props.apiBuildFolder
    if (!fs.existsSync(appBuildPath)) {
      if (process.env.NO_BUILD?.toLowerCase() !== 'true') {
        console.log(`No ${appBuildPath} directory, building...`)
        execNpm(props.apiNpmBuildCommand)
      } else {
        console.log(`Creating build folder structure at ${appBuildPath}`)
        fs.mkdirSync(appBuildPath)

        console.log(`Creating a lambda handler at ${path.join(appBuildPath, 'handler.js')}`)
        fs.writeFileSync(path.join(appBuildPath, 'handler.js'), 'exports.handler = () => {}')
      }
    }

    const s3Cache = new s3.Bucket(this, `${id}-cache`, {
      bucketName: `${id}-cache`,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      publicReadAccess: false,
      versioned: false,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })


    /*****************/
    // Secrets
    /*****************/
    if (!props.secretNames) {
      props.secretNames = []
    }
    const envSecretArns: Record<string, string> = {}
    const secrets: Secret[] = []
    for (const secretName of props.secretNames) {
      const secret = new Secret(this, secretName.toUpperCase(), {
        secretName: `/${id}/${secretName.toUpperCase()}`,
      })
      envSecretArns[`${secretName.toUpperCase()}_ARN`] = secret.secretArn
      secrets.push(secret)
    }

    /*****************/
    // Environment
    /*****************/
    const environment: Record<string, string> = {
      CACHE_BUCKET_NAME: s3Cache.bucketName,
      ...props.envVars,
      ...(props.PROXY_PATH ? { PROXY_PATH: props.PROXY_PATH } : {}),
      ...envSecretArns,
    }

    /*****************/
    // Lambda
    /*****************/
    this.apiLambda = new lambda.Function(this, `${id}-api`, {
      functionName: `${id}-api`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(appBuildPath),
      tracing: lambda.Tracing.ACTIVE,
      handler: 'src/lambda-handler.handler',
      timeout: props.timeout,
      memorySize: props.memorySize,
      retryAttempts: 0,
      environment,
    })

    s3Cache.grantReadWrite(this.apiLambda)
    secrets.forEach((s) => s.grantRead(this.apiLambda))
    this.apiLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['xray:PutTraceSegment', 'xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    )

    // DNS & SSL
    if (props.customDomain) {
      const customDomainConfig = new CustomDomainConfig(this, `${id}-dns`, props.customDomain)

      if (!customDomainConfig.sslCertificate) {
        throw new Error('An SSL certificate is required to be configured to secure the API')
      }

      const gateway = new apiGateway.LambdaRestApi(this, `${id}-api-gateway`, {
        handler: this.apiLambda,
        domainName: {
          certificate: customDomainConfig.sslCertificate,
          domainName: customDomainConfig.config.domainName,
          endpointType: EndpointType.EDGE,
        },
      })

      new CustomDomain(this, `${id}-dns`, {
        config: customDomainConfig,
        target:
          customDomainConfig.config.dnsRecordType === 'ALIAS'
            ? new targets.ApiGateway(gateway)
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            gateway.domainName!.domainNameAliasDomainName,
      })
    } else {
      new apiGateway.LambdaRestApi(this, `${id}-api-gateway`, {
        handler: this.apiLambda,
      })
    }

    /*****************/
    // Exports
    /*****************/
    for (const secretName of props.secretNames) {
      new cdk.CfnOutput(this, `${id}-${secretName.replace(/_/g, '').toLowerCase()}-SecretArn`, {
        exportName: `${id}-${secretName.replace(/_/g, '').toLowerCase()}-SecretArn`,
        value: JSON.stringify({
          arn: envSecretArns[`${secretName.toUpperCase()}_ARN`],
          environmentKey: secretName.toUpperCase(),
        }),
      })
    }

    new cdk.CfnOutput(this, 'ApiStack', {
      exportName: `${id}-ApiStack`,
      value: JSON.stringify({
        ApiLambdaArn: this.apiLambda.functionArn,
      }),
    })
  }
}
