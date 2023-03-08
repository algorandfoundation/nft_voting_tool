import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { IAliasRecordTarget, RecordSet } from 'aws-cdk-lib/aws-route53'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'
import { CertificateRequest, DnsStack } from './dns-stack'

export interface CustomDomainProps {
  /** The configuration for the custom domain */
  config: CustomDomainConfig
  /** The target being pointed to */
  target: string | IAliasRecordTarget
}

export type CustomDomainConfigProps =
  | CustomDomainConfigViaARNProps
  | CustomDomainConfigViaSSMParamsProps
  | CustomDomainConfigViaDnsStackProps
  | CustomDomainConfigViaDnsWithSSLStackProps

export interface CustomDomainConfigBaseProps {
  /** How the custom DNS properties are specified */
  type: 'ssm-params' | 'dns-stack' | 'arn'
  /** Domain name being deployed to */
  domainName: string
}

export interface CustomDomainConfigViaARNProps extends CustomDomainConfigBaseProps {
  type: 'arn'
  /** The hosted zone name of the route 53 zone that will hold DNS records */
  hostedZoneName: string
  /** The hosted zone ID of the route 53 zone that will hold DNS records */
  hostedZoneId: string
  /** Optional ARN of an AWS SSL certificate that will be used for HTTPS; undefined for no SSL */
  certificateArn?: string
  /** The type of DNS record to create */
  dnsRecordType: 'CNAME' | 'ALIAS'
}

export interface CustomDomainConfigViaSSMParamsProps extends CustomDomainConfigBaseProps {
  type: 'ssm-params'
  /** The hosted zone name of the route 53 zone that will hold DNS records */
  hostedZoneName: string
  /** SSM Parameter name with the hosted zone ID of the route 53 zone that will hold DNS records */
  hostedZoneIdParameterName: string
  /** Optional SSM Parameter name with the ARN of an AWS SSL certificate that will be used for HTTPS; undefined for no SSL */
  certificateArnParameterName?: string | undefined
  /** Region being deployed to */
  region: string
  /** The type of DNS record to create */
  dnsRecordType: 'CNAME' | 'ALIAS'
}

export interface CustomDomainConfigViaDnsWithSSLStackProps extends CustomDomainConfigBaseProps {
  type: 'dns-stack'
  /** DNS Stack to use for DNS */
  dnsStack: DnsStack
  /** Region being deployed to */
  region: string
  /** Whether the custom domain has SSL certificate */
  hasSSL: true
  /** The optional certificate request if SSL is being used; undefined for no SSL */
  certificateRequest: CertificateRequest
}

export interface CustomDomainConfigViaDnsStackProps extends CustomDomainConfigBaseProps {
  type: 'dns-stack'
  /** DNS Stack to use for DNS */
  dnsStack: DnsStack
  /** Region being deployed to */
  region: string
  /** Whether the custom domain has SSL certificate */
  hasSSL: false
  /** The type of DNS record to create */
  dnsRecordType: 'CNAME' | 'ALIAS'
}

const dnsStackToSSMProps = (
  props: CustomDomainConfigViaDnsStackProps | CustomDomainConfigViaDnsWithSSLStackProps
): CustomDomainConfigViaSSMParamsProps => {
  return {
    type: 'ssm-params',
    region: props.region,
    hostedZoneName: props.dnsStack.domainName,
    domainName: props.domainName,
    dnsRecordType: 'certificateRequest' in props ? (props.certificateRequest.isRoot ? 'ALIAS' : 'CNAME') : props.dnsRecordType,
    certificateArnParameterName:
      'certificateRequest' in props ? props.dnsStack.getCertificateArnParameterName(props.region, props.certificateRequest) : undefined,
    hostedZoneIdParameterName: props.dnsStack.getHostedZoneIdParameterName(props.region),
  }
}

const ssmToArnProps = (scope: Construct, id: string, props: CustomDomainConfigViaSSMParamsProps): CustomDomainConfigViaARNProps => {
  let certificateArn: string | undefined = undefined
  if (props.certificateArnParameterName) {
    // Certificate often needs to be deployed into us-east-1, which may differ from the region this Stack is deployed to
    // Using a SSM parameter to get the ARN allows us to avoid CloudFormation cross-region errors
    const sslArnParameter = ssm.StringParameter.fromStringParameterAttributes(scope, `${id}-ssm-ssl-cert`, {
      parameterName: props.certificateArnParameterName,
      simpleName: false,
    })
    certificateArn = sslArnParameter.stringValue
  }

  // We can't use route53.fromLookup since it causes https://github.com/aws/aws-cdk/issues/5547 to occur
  // Hosted Zone is deployed via a stack in us-east-1, which may differ from the region this Stack is deployed to
  // So we can't directly reference props.hostedZone.zoneId or it fails with a cross-region error
  // Using a SSM parameter to get the ID allows us to avoid CloudFormation cross-region errors
  const hostedZoneIdParameter = ssm.StringParameter.fromStringParameterAttributes(scope, `${id}-ssm-hostedZoneId`, {
    parameterName: props.hostedZoneIdParameterName,
    simpleName: false,
  })

  return {
    type: 'arn',
    hostedZoneName: props.hostedZoneName,
    domainName: props.domainName,
    dnsRecordType: props.dnsRecordType,
    hostedZoneId: hostedZoneIdParameter.stringValue,
    certificateArn: certificateArn,
  }
}

/** Creates DNS record for custom domain */
export class CustomDomain {
  public dnsRecord: RecordSet

  constructor(scope: Construct, id: string, props: CustomDomainProps) {
    const arnProps = props.config.config

    if (arnProps.dnsRecordType === 'ALIAS' || typeof props.target !== 'string') {
      if (typeof props.target === 'string') {
        throw new Error(`Expected ALIAS target for DNS record against ${arnProps.domainName}, but got ${props.target}`)
      }

      this.dnsRecord = new route53.ARecord(scope, `${id}-alias`, {
        recordName: arnProps.domainName,
        target: route53.RecordTarget.fromAlias(props.target),
        zone: route53.HostedZone.fromHostedZoneAttributes(scope, `${id}-zone`, {
          zoneName: arnProps.hostedZoneName,
          hostedZoneId: arnProps.hostedZoneId,
        }),
      })
    } else {
      this.dnsRecord = new route53.CnameRecord(scope, `${id}-cname`, {
        recordName: arnProps.domainName,
        domainName: props.target,
        zone: route53.HostedZone.fromHostedZoneAttributes(scope, `${id}-zone`, {
          zoneName: arnProps.hostedZoneName,
          hostedZoneId: arnProps.hostedZoneId,
        }),
      })
    }
  }
}

/** Prepares configuration of custom domain, including optionally exposes SSL certificate that corresponds to a custom domain */
export class CustomDomainConfig {
  public sslCertificate: ICertificate | undefined
  public config: CustomDomainConfigViaARNProps

  constructor(scope: Construct, id: string, props: CustomDomainConfigProps) {
    const arnProps =
      props.type === 'dns-stack' || props.type === 'ssm-params'
        ? ssmToArnProps(scope, id, props.type === 'dns-stack' ? dnsStackToSSMProps(props) : props)
        : props

    this.config = arnProps
    if (arnProps.certificateArn) {
      this.sslCertificate = Certificate.fromCertificateArn(scope, `${id}-ssl-cert`, arnProps.certificateArn)
    }
  }
}
