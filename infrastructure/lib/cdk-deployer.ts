import * as cdk from 'aws-cdk-lib'
import { Environment } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { getRequiredEnv } from './env'

// https://www.simonholywell.com/post/typescript-constructor-type.html
type CDKStackConstructor<T extends cdk.Stack, TProps extends cdk.StackProps> = new (scope: Construct, id: string, props: TProps) => T

/** Settings to create a CDK deployer. */
export interface CDKDeployerSettings {
  /** The name of the system being deployed into - this is the ultimate parent */
  systemName: string
  /** The name of the app being deployed - make this different to the system name to avoid weird naming */
  appName: string
  /** Optionally override the account being deployed into; by default it will use `process.env.CDK_DEFAULT_ACCOUNT` */
  account?: string
  /** Optionally override the region being deployed into; by default it will use `process.env.AWS_DEFAULT_REGION` */
  region?: string
  /** Optionally override the environment being deployed into; by default it will use the `environment` context value passed into CDK or if that's not present then `process.env.DEPLOYMENT_ENVIRONMENT` */
  environment?: string
}

/**
 * CDK Deployer that uses conventions to create a safer, terser CDK deployment experience.
 */
export class CDKDeployer {
  private _app: cdk.App
  private _defaultRegion: string
  private _env: Environment
  private _appId: string
  private _envName: string
  private _isProd: boolean
  private _defaultTags: Record<string, string>

  /** Name of the environment being deployed to (lowercase). */
  public get envName(): string {
    return this._envName
  }

  /** Default CDK @see Environment object used for deployments. */
  public get env(): Environment {
    return this._env
  }

  /** Default AWS region used for deployments. */
  public get defaultRegion(): string {
    return this._defaultRegion
  }

  /** Whether or not the current deployment is deploying to a production environment. */
  public get isProd(): boolean {
    return this._isProd
  }

  /** The default stack tags that are being used. */
  public get defaultTags(): Record<string, string> {
    return this._defaultTags
  }

  /**
   * Creates a new CDK deployer.
   * @param param0 The settings for the deployment
   */
  constructor({ systemName, appName, account, region, environment }: CDKDeployerSettings) {
    this._app = new cdk.App()
    this._appId = `${systemName}-${appName}`
    const envName = (this._app.node.tryGetContext('environment') as string) ?? process.env.DEPLOYMENT_ENVIRONMENT ?? environment
    if (!envName) {
      throw 'No environment defined; please pass in via CDK or DEPLOYMENT_ENVIRONMENT environment variable. If running locally be sure you have copied .env.template to .env and filled in.'
    }
    this._defaultRegion = region ?? getRequiredEnv('AWS_DEFAULT_REGION')
    this._env = {
      account: account ?? process.env.CDK_DEFAULT_ACCOUNT,
      region: this._defaultRegion,
    }
    this._envName = envName.toLowerCase()
    this._isProd = this._envName.includes('prod')
    this._defaultTags = {
      system: systemName,
      app: appName,
      environment: envName,
    }
  }

  /**
   * Returns a (non-prod) environment prefixed domain name e.g. {env}.{basedomain.tld} or if in production {basedomain.tld}
   * @param baseDomain The base domain name
   * @returns The environment prefixed domain name
   */
  public getEnvPrefixedDomainName(baseDomain: string | undefined): string | undefined {
    return baseDomain ? `${!this._isProd ? `${this._envName}.` : ''}${baseDomain}` : undefined
  }

  /**
   * Returns the (convention-based) name for a CDK stack - `{system}-{app}-{stack}-{env}`.
   *
   * This helps ensure that there is a consistent, hierarchically sound, unique name for
   *  each stack to avoid stack conflicts and the need to rename stacks in the future
   *  (which causes a lot of pain).
   *
   * @param stackName The name to use to identify the stack (should be short and lower-kebab-case)
   * @returns The stack name
   */
  public getStackName(stackName: string) {
    return `${this._appId}-${stackName}-${this._envName}`
  }

  /**
   * Deploys a given CDK stack.
   *
   * @param stackCtor The constructor of the stack to deploy
   * @param stackName The name to use to identify the stack (should be short and lower-kebab-case)
   * @param props The props to pass into the stack, note: `stackName`, `env` and `tags` will be populated for you if left out
   * @param region The optional region to deploy to if overriding the default region (for example to deploy special resources into `us-east-1`)
   * @returns The stack that was deployed (so you can set up dependencies etc.)
   */
  public deploy<TStack extends cdk.Stack, TStackProps extends cdk.StackProps>(
    stackCtor: CDKStackConstructor<TStack, TStackProps>,
    stackName: string,
    props: TStackProps,
    region?: string,
  ): TStack {
    const stackNameFull = this.getStackName(stackName.toLowerCase())
    const stackProps = {
      ...props,
      ...(!props.env
        ? {
            env: region
              ? {
                  account: this._env.account,
                  region: region,
                }
              : this._env,
          }
        : {}),
      ...(!props.stackName
        ? {
            stackName: stackNameFull,
          }
        : {}),
      ...(!props.tags
        ? {
            tags: {
              stack: stackName,
              ...this._defaultTags,
            },
          }
        : {}),
    }
    return new stackCtor(this._app, stackNameFull, stackProps)
  }
}
