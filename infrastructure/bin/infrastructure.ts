#!/usr/bin/env node
import * as path from 'path'
import { CDKDeployer } from '../lib/cdk-deployer'
import { DnsStack } from '../lib/dns-stack'
import { StaticWebsiteStack } from '../lib/static-website-stack'

const deployer = new CDKDeployer({
  systemName: 'algorandfoundation',
  appName: 'nft-voting-tool',
})

const appDomainName = deployer.getEnvPrefixedDomainName(process.env.BASE_DOMAIN)

const dns = appDomainName
  ? deployer.deploy(
    DnsStack,
    'dns-web',
    {
      domainName: appDomainName,
      generateCertificate: true,
      parameterRegions: [deployer.defaultRegion],
      certificateRequests: [DnsStack.ROOT_CERT_REQUEST],
    },
    'us-east-1',
  )
  : undefined

const app = deployer.deploy(StaticWebsiteStack, 'web', {
  websiteFolder: process.env.WEBSITE_BUILD_PATH ?? path.join(__dirname, '..', '..', 'src', 'dapp', 'dist'),
  websiteNpmBuildCommand: 'build-dapp',
  customDomain: dns?.getDefaultCustomDomainProps(deployer.defaultRegion, appDomainName),
})

if (dns) {
  app.addDependency(dns)
}
