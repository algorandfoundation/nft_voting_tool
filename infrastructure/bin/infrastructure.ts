#!/usr/bin/env node
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
  isRoot: false
}

const dns = appDomainName
  ? deployer.deploy(
    DnsStack,
    'dns-web',
    {
      domainName: appDomainName,
      generateCertificate: true,
      parameterRegions: [deployer.defaultRegion],
      certificateRequests: [
        DnsStack.ROOT_CERT_REQUEST,
        apiCertificateRequest
      ],
    },
    'us-east-1',
  )
  : undefined

const app = deployer.deploy(StaticWebsiteStack, 'web', {
  websiteFolder: process.env.WEBSITE_BUILD_PATH ?? path.join(__dirname, '..', '..', 'src', 'dapp', 'dist'),
  websiteNpmBuildCommand: 'build-dapp',
  customDomain: dns?.getDefaultCustomDomainProps(deployer.defaultRegion, appDomainName),
})

const api = deployer.deploy(ApiStack, 'api', {
  apiBuildFolder: process.env.API_BUILD_PATH ?? path.join(__dirname, '..', '..', 'src', 'voting-metadata-api', 'build'),
  apiNpmBuildCommand: 'build',
  customDomain: dns?.getDefaultCustomDomainProps(deployer.defaultRegion, apiDomainName, apiCertificateRequest),
  envVars: {
    WEB3_STORAGE_API_TOKEN: getRequiredEnv("WEB3_STORAGE_API_TOKEN"),
    NODE_ENV: getRequiredEnv("NODE_ENV")
  },

})

if (dns) {
  app.addDependency(dns)
  api.addDependency(dns)
}
