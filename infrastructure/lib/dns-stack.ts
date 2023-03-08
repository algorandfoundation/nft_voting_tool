import { CrossRegionParameter } from '@henrist/cdk-cross-region-params'
import { Stack, StackProps } from 'aws-cdk-lib'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { CustomDomainConfigProps, CustomDomainConfigViaDnsStackProps, CustomDomainConfigViaDnsWithSSLStackProps } from './custom-domain'

export interface BaseDnsProps extends StackProps {
  /** The domain name to generate DNS hosted zone for e.g. myapp.makerx.tech */
  domainName: string
  /** Any regions to generate SSM Parameters for to allow cross-region referencing of Route53 hosted zone and/or SSL certs.
   *
   * This is useful where you need to deploy DNS Stack to us-east-1 so SSL is deployed in a cloudfront accessible manner, but you want to deploy everything else to another region.
   */
  parameterRegions: string[]
}

export interface DnsProps extends BaseDnsProps {
  /** Don't generate any SSL certs */
  generateCertificate: false
}

export interface DnsPropsWithCert extends BaseDnsProps {
  /** Generate SSL certs */
  generateCertificate: true
  /** If generating SSL certs then all of the certificate requests to generate */
  certificateRequests: CertificateRequest[]
}

export type CertificateRequest =
  | {
      /** Root certificate in hosted zone `domainName` */
      isRoot: true
      /** Generate cert as a wildcard cert */
      isWildCard: boolean
    }
  | {
      isRoot?: false
      /** Generate cert as a subdomain of `{subDomain}.domainName` */
      subDomain: string
      /** Generate cert as a wildcard cert */
      isWildCard: boolean
    }

/** Generates Route53 hosted zone to house DNS and optionally creates SSL certificates with validation records in Route53, deploy this to us-east-1 if you want SSL that works with Cloudfront */
export class DnsStack extends Stack {
  /** Convenient definition of a root SSL certificate request
   *
   * i.e.:
   * ```
   * {
   *    isRoot: true,
   *    isWildCard: false,
   * }
   * ```
   */
  public static readonly ROOT_CERT_REQUEST: CertificateRequest = {
    isRoot: true,
    isWildCard: false,
  }

  public readonly hostedZone: PublicHostedZone
  public readonly certificate: Certificate | undefined
  public readonly certificateRequests: CertificateRequest[]

  public readonly domainName: string
  public readonly hasCertificate: boolean

  private readonly hostedZoneIdParameterName: string
  private readonly certificateParameterNamePrefix: string

  private getParameterName(parameterName: string, region: string): string {
    if (!region) {
      return parameterName
    }

    return `${parameterName}-${region}`
  }

  private getCertificateName(certificateRequest: CertificateRequest) {
    return `ssl-cert${certificateRequest.isRoot ? '' : `-${certificateRequest.subDomain}`}`
  }

  public getHostedZoneIdParameterName(region: string): string {
    return this.getParameterName(this.hostedZoneIdParameterName, region)
  }

  public getCertificateArnParameterName(region: string, certificateRequest: CertificateRequest): string {
    const certificateName = this.getCertificateName(certificateRequest)
    const parameterName = `${this.certificateParameterNamePrefix}-${certificateName}-arn`
    return this.getParameterName(parameterName, region)
  }

  /**
   * Returns the default custom domain props - with or without SSL based on whether SSL was configured for this DNS Stack.
   * If SSL is configured then the first certificate request will be used.
   *
   * @param region The region the stack the custom domain is being deployed into is
   * @param domainName Optional domain name override; if unspecified then the domain name of the DNSStack will be used
   * @returns The props for the custom domain config
   */
  public getDefaultCustomDomainProps(region: string, domainName?: string): CustomDomainConfigProps {
    return this.hasCertificate
      ? ({
          type: 'dns-stack',
          hasSSL: true,
          dnsStack: this,
          certificateRequest: this.certificateRequests[0],
          domainName: domainName ?? this.domainName,
          region: region,
        } as CustomDomainConfigViaDnsWithSSLStackProps)
      : ({
          type: 'dns-stack',
          hasSSL: false,
          dnsStack: this,
          domainName: domainName ?? this.domainName,
          region: region,
          dnsRecordType: !domainName || domainName === this.domainName ? 'ALIAS' : 'CNAME',
        } as CustomDomainConfigViaDnsStackProps)
  }

  constructor(scope: Construct, id: string, props: DnsProps | DnsPropsWithCert) {
    super(scope, id, props)

    this.domainName = props.domainName
    this.hasCertificate = props.generateCertificate
    this.hostedZoneIdParameterName = `/${id}-hosted-zone-id`
    this.certificateParameterNamePrefix = `/${id}`
    this.certificateRequests = props.generateCertificate ? props.certificateRequests : []

    this.hostedZone = new PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
    })
    props.parameterRegions.forEach((region) => {
      new CrossRegionParameter(this, `${id}-ssm-hosted-zone-id-${region}`, {
        name: this.getHostedZoneIdParameterName(region),
        region,
        value: this.hostedZone.hostedZoneId,
      })
    })

    if (props.generateCertificate && props.certificateRequests.length > 0) {
      // If you are deploying a certificate for Cloudfront then you will need to set the region of this Stack to us-east-1
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html#https-requirements-aws-region
      // The rest of your stacks might be deployed to another region though, which causes cross-region issues with CDK
      // https://cmorgia.medium.com/cdk-and-the-sharing-of-cross-region-data-955925685e57
      // The following overcomes those cross-region limitations by using `CrossRegionParameter`
      props.certificateRequests.forEach((certificateRequest) => {
        const certificateName = this.getCertificateName(certificateRequest)
        const domainName = certificateRequest.isRoot ? props.domainName : `${certificateRequest.subDomain}.${props.domainName}`
        const certificate = new Certificate(this, `${id}-${certificateName}`, {
          domainName: certificateRequest.isWildCard ? `*.${domainName}` : domainName,
          validation: CertificateValidation.fromDns(this.hostedZone),
        })

        props.parameterRegions.forEach((region) => {
          new CrossRegionParameter(this, `${id}-ssm-${certificateName}-${region}`, {
            name: this.getCertificateArnParameterName(region, certificateRequest),
            region,
            value: certificate.certificateArn,
          })
        })
      })
    }
  }
}
