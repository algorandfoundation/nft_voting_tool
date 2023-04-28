#!/usr/bin/env node
import { Duration } from 'aws-cdk-lib'
import { HeadersFrameOption, HeadersReferrerPolicy, ResponseHeadersPolicyProps } from 'aws-cdk-lib/aws-cloudfront'
import * as path from 'path'
import { ApiStack } from '../lib/api-stack'
import { CDKDeployer } from '../lib/cdk-deployer'
import { CertificateRequest, DnsStack } from '../lib/dns-stack'
import { getRequiredEnv } from '../lib/env'
import { StaticWebsiteStack } from '../lib/static-website-stack'

const deployer = new CDKDeployer({
  systemName: 'algorandfoundation',
  appName: 'nft-voting-tool',
})

const appDomainName = deployer.getEnvPrefixedDomainName(process.env.BASE_DOMAIN)
const apiDomainName = `api.${appDomainName}`

const apiCertificateRequest: CertificateRequest = {
  isWildCard: false,
  subDomain: 'api',
  isRoot: false,
}

const dns = appDomainName
  ? deployer.deploy(
      DnsStack,
      'dns-web',
      {
        domainName: appDomainName,
        generateCertificate: true,
        parameterRegions: [deployer.defaultRegion],
        certificateRequests: [DnsStack.ROOT_CERT_REQUEST, apiCertificateRequest],
      },
      'us-east-1',
    )
  : undefined

const responseHeaders: ResponseHeadersPolicyProps = {
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
      referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
    },
    frameOptions: {
      override: false,
      frameOption: HeadersFrameOption.DENY,
    },
    contentSecurityPolicy: {
      override: false,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'self' 'sha256-gpTXtSqO2yobu1NfigGIFT+I2q+NHG3K5qAkdbhk8vw='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src *; media-src 'self'; object-src 'none'; frame-src 'self'; worker-src 'none'; upgrade-insecure-requests; base-uri 'self'; manifest-src 'self'",
    },
  },
  customHeadersBehavior: {
    customHeaders: [
      {
        header: 'Permissions-Policy',
        override: false,
        value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
      },
    ],
  },
  removeHeaders: ['server'],
}

const app = deployer.deploy(StaticWebsiteStack, 'web', {
  websiteFolder: process.env.WEBSITE_BUILD_PATH ?? path.join(__dirname, '..', '..', 'src', 'dapp', 'dist'),
  websiteNpmBuildCommand: 'build-dapp',
  customDomain: dns?.getDefaultCustomDomainProps(deployer.defaultRegion, appDomainName),
  responseHeaders: responseHeaders,
})

const api = deployer.deploy(ApiStack, 'api', {
  apiBuildFolder: process.env.API_BUILD_PATH ?? path.join(__dirname, '..', '..', 'src', 'voting-metadata-api', 'build'),
  apiNpmBuildCommand: 'build',
  customDomain: dns?.getDefaultCustomDomainProps(deployer.defaultRegion, apiDomainName, apiCertificateRequest),
  envVars: {
    WEB3_STORAGE_API_TOKEN: getRequiredEnv('WEB3_STORAGE_API_TOKEN'),
    NODE_ENV: getRequiredEnv('NODE_ENV'),
    ALLOWED_ADDRESSES: getRequiredEnv('API_ALLOWED_ADDRESSES'),
    BINARY_CONTENT_TYPES: getRequiredEnv('API_BINARY_CONTENT_TYPES'),
  },
})

if (dns) {
  app.addDependency(dns)
  api.addDependency(dns)
}
