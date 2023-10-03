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

const appDomainName = deployer.getEnvPrefixedDomainName(`voting.${process.env.BASE_DOMAIN}`)
const apiDomainName = `api.${appDomainName}`
const xGovAppDomainName = deployer.getEnvPrefixedDomainName(`xgov.${process.env.BASE_DOMAIN}`)

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

const xGovDns = xGovAppDomainName
  ? deployer.deploy(
    DnsStack,
    'dns-xgovweb',
    {
      domainName: xGovAppDomainName,
      generateCertificate: true,
      parameterRegions: [deployer.defaultRegion],
      certificateRequests: [DnsStack.ROOT_CERT_REQUEST],
    },
    'us-east-1',
  )
  : undefined

const responseHeaders: ResponseHeadersPolicyProps = {
  securityHeadersBehavior: {
    contentSecurityPolicy: {
      override: false,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'self' 'sha256-gpTXtSqO2yobu1NfigGIFT+I2q+NHG3K5qAkdbhk8vw='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; object-src 'none'; base-uri 'self'; connect-src *; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://web.perawallet.app; img-src 'self' api.testnet.voting.algorand.foundation data:; manifest-src 'self'; media-src 'self' api.testnet.voting.algorand.foundation; worker-src 'none'; upgrade-insecure-requests;",
    },
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

// const app = deployer.deploy(StaticWebsiteStack, 'web', {
//   websiteFolder: process.env.WEBSITE_BUILD_PATH ?? path.join(__dirname, '..', '..', 'src', 'dapp', 'dist'),
//   websiteNpmBuildCommand: 'build-dapp',
//   customDomain: dns?.getDefaultCustomDomainProps(deployer.defaultRegion, appDomainName),
//   responseHeaders: responseHeaders,
// })

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

const xGovApp = deployer.deploy(StaticWebsiteStack, 'xgovweb', {
  websiteFolder: process.env.WEBSITE_BUILD_PATH_XGOV ?? path.join(__dirname, '..', '..', 'src', 'xgov-dapp', 'dist'),
  websiteNpmBuildCommand: 'build-xgov-dapp',
  customDomain: xGovDns?.getDefaultCustomDomainProps(deployer.defaultRegion, xGovAppDomainName),
  responseHeaders: responseHeaders,
})

if (dns) {
  // app.addDependency(dns)
  api.addDependency(dns)
}

if (xGovDns) {
  xGovApp.addDependency(xGovDns)
}
