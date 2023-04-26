import * as cdk from 'aws-cdk-lib'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import { CachePolicy } from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import * as fs from 'fs'
import * as path from 'path'
import { CustomDomain, CustomDomainConfig, CustomDomainConfigProps } from './custom-domain'
import { execNpm } from './exec-npm'

/** The props to create a static website */
export interface StaticWebsiteProps extends cdk.StackProps {
  // Custom domain
  customDomain?: CustomDomainConfigProps

  // Files
  /** The folder to the website files e.g. `path.join(__dirname, '..', '..', 'website', 'build')` */
  websiteFolder: string
  /** The npm script command to build the website if the website files aren't built, set `process.env.NO_BUILD` to `true` to disable this feature */
  websiteNpmBuildCommand: string

  // Caching
  /** What query string values should get passed through Cloudfront to the underlying website; default: all */
  queryStringPassthrough?: 'all' | 'none' | string[]
  /** What cookie values should get passed through Cloudfront to the underlying website; default: all */
  cookiePassthrough?: 'all' | 'none' | string[]
  /** What HTTP header values should get passed through Cloudfront to the underlying website; default: none */
  httpHeaderPassthrough?: 'all' | 'none' | string[]
  /** What query string values should be included in the Cloudfront cache key; default: all */
  queryStringCache?: 'all' | 'none' | string[]
  /** What cookie values should be included in the Cloudfront cache key; default: none */
  cookieCache?: 'all' | 'none' | string[]
  /** What HTTP header values should be included in the Cloudfront cache key; default: ['Accept', 'Accept-Language', 'Authorization'] */
  httpHeaderCache?: 'all' | 'none' | string[]
  /** What should the default caching duration be; default: 1 day */
  cachingDefault?: Duration
  /** What should the max caching duration be; default: 30 days */
  cachingMax?: Duration
}

/** Deploys a static website using S3 and Cloudfront */
export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
    super(scope, id, props)

    /*****************/
    // Defaults
    /*****************/
    if (!props.queryStringPassthrough) {
      props.queryStringPassthrough = 'all'
    }
    if (!props.cookiePassthrough) {
      props.cookiePassthrough = 'all'
    }
    if (!props.queryStringCache) {
      props.queryStringCache = 'all'
    }
    if (!props.httpHeaderPassthrough) {
      props.httpHeaderPassthrough = 'none'
    }
    if (!props.cookieCache) {
      props.cookieCache = 'none'
    }
    if (!props.httpHeaderCache) {
      props.httpHeaderCache = ['Accept', 'Accept-Language', 'Authorization']
    }
    if (!props.cachingDefault) {
      props.cachingDefault = Duration.minutes(30)
    }
    if (!props.cachingMax) {
      props.cachingMax = Duration.days(30)
    }

    /*****************/
    // Prep build directory
    /*****************/

    // If there is no `build` directory for the code target (e.g. if running locally) then generate it so there is code to deploy
    const websiteBuildPath = props.websiteFolder
    if (!fs.existsSync(websiteBuildPath)) {
      if (process.env.NO_BUILD?.toLowerCase() !== 'true') {
        console.log(`No ${websiteBuildPath} directory, building...`)
        execNpm(props.websiteNpmBuildCommand)
      } else {
        // No build directory, but we have been told not to build so likely we are just doing a cdk synth and just need the directory to look about right for a Remix site
        console.log(`Creating build folder structure at ${websiteBuildPath}`)
        fs.mkdirSync(websiteBuildPath)

        console.log(`Creating index.html at ${path.join(websiteBuildPath, 'index.html')}`)
        fs.writeFileSync(path.join(websiteBuildPath, 'index.html'), '<html></html>')
      }
    }

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, `${id}-cloudfront-oai`)

    const siteBucket = new s3.Bucket(this, `${id}-assets`, {
      bucketName: `${id}-assets`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [siteBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      }),
    )

    /*****************/
    // CDN, SSL and DNS
    /*****************/
    let customDomainConfig: CustomDomainConfig | undefined
    if (props.customDomain) {
      customDomainConfig = new CustomDomainConfig(this, `${id}-dns`, props.customDomain)
    }

    const defaultRedirectFunction = new cloudfront.Function(this, 'DefaultRedirectFunction', {
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.join(__dirname, 'subfolder-index-rewrite-lambda/default-redirect-function.js'),
      }),
      functionName: `${id}-default-redirect`,
    })

    const cachePolicy = new CachePolicy(this, `${id}-cloudfront-cache`, {
      cachePolicyName: `${id}-cloudfront-cache`,
      // Min of 0 is important otherwise cloudfront ignores No-Cache headers!
      minTtl: Duration.minutes(0),
      defaultTtl: props.cachingDefault,
      maxTtl: props.cachingMax,
      headerBehavior:
        props.httpHeaderCache === 'none'
          ? cloudfront.CacheHeaderBehavior.none()
          : cloudfront.CacheHeaderBehavior.allowList(...props.httpHeaderCache),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      queryStringBehavior:
        props.queryStringCache === 'all'
          ? cloudfront.CacheQueryStringBehavior.all()
          : props.queryStringCache === 'none'
            ? cloudfront.CacheQueryStringBehavior.none()
            : cloudfront.CacheQueryStringBehavior.allowList(...props.queryStringCache),
      cookieBehavior:
        props.cookieCache === 'all'
          ? cloudfront.CacheCookieBehavior.all()
          : props.cookieCache === 'none'
            ? cloudfront.CacheCookieBehavior.none()
            : cloudfront.CacheCookieBehavior.allowList(...props.cookieCache),
    })

    const originRequestPolicy = new cloudfront.OriginRequestPolicy(this, `${id}-request-handler-policy`, {
      originRequestPolicyName: `${id}-request-handler-policy`,
      queryStringBehavior:
        props.queryStringPassthrough === 'all'
          ? cloudfront.OriginRequestQueryStringBehavior.all()
          : props.queryStringPassthrough === 'none'
            ? cloudfront.OriginRequestQueryStringBehavior.none()
            : cloudfront.OriginRequestQueryStringBehavior.allowList(...props.queryStringPassthrough),
      cookieBehavior:
        props.cookiePassthrough === 'all'
          ? cloudfront.OriginRequestCookieBehavior.all()
          : props.cookiePassthrough === 'none'
            ? cloudfront.OriginRequestCookieBehavior.none()
            : cloudfront.OriginRequestCookieBehavior.allowList(...props.cookiePassthrough),
      // https://stackoverflow.com/questions/65243953/pass-query-params-from-cloudfront-to-api-gateway
      headerBehavior:
        props.httpHeaderPassthrough === 'all'
          ? cloudfront.OriginRequestHeaderBehavior.all()
          : props.httpHeaderPassthrough === 'none'
            ? cloudfront.OriginRequestHeaderBehavior.none()
            : cloudfront.OriginRequestHeaderBehavior.allowList(...props.httpHeaderPassthrough),
    })

    //default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; object-src 'none'; base-uri 'self';font-src 'self' https://fonts.gstatic.com; frame-src 'self'; img-src 'self' data:; manifest-src 'self'; media-src 'self'; worker-src 'none';

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, `${id}-response-headers-policy`, {
      securityHeadersBehavior: {
        contentTypeOptions: {
          override: false,
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          override: false,
          includeSubdomains: true,
          preload: true,
        },
        xssProtection: {
          override: false,
          modeBlock: true,
          protection: true,
        },
        referrerPolicy: {
          override: false,
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
        },
        frameOptions: {
          override: false,
          frameOption: cloudfront.HeadersFrameOption.DENY,
        },
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'Content-Security-Policy-Report-Only',
            override: false,
            value:
              "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src *; media-src 'self'; object-src 'none'; frame-src 'self'; worker-src 'none'; upgrade-insecure-requests; base-uri 'self'; manifest-src 'self'",
          },
        ],
      },
    })

    const distribution = new cloudfront.Distribution(this, `${id}-cloudfront`, {
      certificate: customDomainConfig?.sslCertificate,
      defaultRootObject: 'index.html',
      domainNames: customDomainConfig?.config.domainName ? [customDomainConfig?.config.domainName] : undefined,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        },
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(siteBucket, { originAccessIdentity: cloudfrontOAI }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: defaultRedirectFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
        cachePolicy: cachePolicy,
        originRequestPolicy: originRequestPolicy,
        responseHeadersPolicy: responseHeadersPolicy,
      },
    })

    if (customDomainConfig) {
      new CustomDomain(this, `${id}-dns`, {
        config: customDomainConfig,
        target: new targets.CloudFrontTarget(distribution),
      })
    }

    /*****************/
    // Static file deployment
    /*****************/
    new s3deploy.BucketDeployment(this, `${id}-bucket-deployment`, {
      sources: [s3deploy.Source.asset(websiteBuildPath)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    })
  }
}
