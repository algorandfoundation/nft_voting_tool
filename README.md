# On-chain Voting Tool

This repository contains a voting tool that allows for creation and facilitation of immutable, tamperproof voting using the Algorand blockchain.

## Background

The Algorand Foundation aims to establish a long term, mutually beneficial relationship with the Algorand NFT ecosystem, stakeholders and community through a series of initiatives to advance the utility and support the growth of the Algorand NFT ecosystem by establishing an NFT Council. A required capability for the establishment is an on-chain voting tool to facilitate transparent community decision making. As such, this Open Source project was created to facilitate the creation of this voting tool as well as provide a general purpose on-chain voting capability to the wider ecosystem.

## Components

The design for this voting tool has been [documented as an Architecture Decision Record](./docs/architecture-decisions/2023-03-02_voting-design.md).

This project contains a number of components:

* [Write-through cache Algorand IPFS gateway](./src/voting-metadata-api/README.md)
* [Voting dApp](./src/dapp/README.md)
* [Voting smart contract](./src/algorand/README.md)
* [AWS CDK Infrastructure as Code](./infrastructure/README.md)
* [GitHub Actions CI/CD pipeline](./.github)

## Running Locally
To run the application locally you need 3 components running.
* An Algorand LocalNet
* The [Write-through cache Algorand IPFS gateway](./src/voting-metadata-api/README.md)
* The [Voting dApp](./src/dapp/README.md)

Here are the steps you can follow to run the application locally:
1. Install `AlgoKit` - [Link](https://github.com/algorandfoundation/algokit-cli#install): Ensure you can execute `algokit --version`.
2. Run `algokit localnet start` to start a LocalNet network
3. Setup and run the [Voting dApp](./src/dapp/README.md) 
    * Do the following in `src/dapp`:
        * Copy `.env.template` to `.env`
        * `npm install`
        * `npm run dev`
4. Setup and run the [Write-through cache Algorand IPFS gateway](./src/voting-metadata-api/README.md)
    * Do the following in `src/voting-metadata-api`:
        * Copy `.env.template` to `.env`
        * `npm install`
        * `npm run dev`

After completing these steps, you should have all three components running locally, and you can test the application.

## Deployment

This solution has automated Continuous Integration and Continuous Delivery support using GitHub Actions, including Infrastructure as Code automation for AWS. This means, you can fully automate the build and multi-environment deployment of this solution without manual steps once you have configured the GitHub Actions secrets and variables.

The deployment pipeline can be [found in](./.github) the `.github` folder.

To use it you need to configure the following with a `DEV_` prefix for TestNet and `PROD_` prefix for MainNet.

* Secrets
    * `AWS_ACCESS_KEY_ID`: The access key of a "deployment user" in AWS with requisite access (see below)
    * `AWS_ACCESS_KEY_SECRET`: The secret of the deployment user
    * `CDK_DEFAULT_ACCOUNT`: The ID of the AWS account being deployed to
    * `WEB3_STORAGE_API_TOKEN`: An API token from a <https://web3.storage/> account
    * `ALGOD_NODE_CONFIG_TOKEN`: (Optional) Token for the algod API if needed
* Variables
    * `ALGOD_NETWORK`: The Algorand network name, either `testnet` or `mainnet`
    * `ALGOD_NODE_CONFIG_PORT`: Likely `443`
    * `ALGOD_NODE_CONFIG_SERVER`: e.g. `https://testnet-api.algonode.cloud/` or `https://mainnet-api.algonode.cloud/` etc.
    * `ENVIRONMENT`: `dev` or `prod`
    * `INDEXER_PORT`: Likely `443`
    * `INDEXER_SERVER`: e.g. `https://testnet-idx.algonode.cloud/` or `https://mainnet-idx.algonode.cloud/` etc.
    * `IPFS_GATEWAY_URL`: The URL to the IPFS gateway that is deployed as part of this solution including the `/ipfs` e.g. `https://api.testnet.voting.algorand.foundation/ipfs`
    * `ALGO_EXPLORER_URL`: The URL to AlgoExplorer e.g. `ALGO_EXPLORER_URL`
    * `NFT_EXPLORER_URL`: The URL to NFT Explorer for an asset, minus the asset ID e.g. `https://nftexplorer.app/asset/`
    * `IS_TESTNET`: `true` or `false`
    * `CREATOR_ALLOW_LIST_ADDRESSES`: The allowlist for voting round creators. To keep it open for anyone set it to `any`. Alternatively you can limit access to an allowist of addresses e.g. `MOIL6NTBHUFAWV5TYY6YYRJ2N3LOAPOBEV4ZPFZAJKZX3OHGQVMYLEHEUU,ODTX32FQL44D5GIJ2CMCEZ4G3FGUU3WUYDHJZDRNSSLHDO54ESGKXC25UQ`

### DNS

The first time you deploy to a given environment, it will reach a point in the `dns-web` stack where it's waiting for the certificate validation. This is happening because it needs DNS to be delegated to the Route 53 instance that has been provisioned.

To do that you need to log into the AWS console, find the new Route 53 instance, see the NS records that are defined in it by default and add them to your source DNS. Note: this means you will be delegating that entire (sub-)domain to AWS to manage. If you don't want to do that, the alternative option is to manually create the validation CName that you will see in Route 53 and then create the other CName records that appear for the dApp and API.

### Least privilege AWS access

We recommend using the following IAM policy, which gives the least access possible to the deployment user to perform the deployment of infrastructure. You just need to replace `{region}` with the name of the region you are deploying into and `{account}` with the ID of the account you are deploying into.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECRPolicy",
            "Effect": "Allow",
            "Action": [
                "ecr:CreateRepository",
                "ecr:DeleteRepository",
                "ecr:DescribeRepositories",
                "ecr:GetLifecyclePolicy",
                "ecr:GetRepositoryPolicy",
                "ecr:ListTagsForResource",
                "ecr:SetRepositoryPolicy",
                "ecr:PutImageTagMutability",
                "ecr:PutImageScanningConfiguration"
            ],
            "Resource": [
                "arn:aws:ecr:{region}:{account}:repository/*",
                "arn:aws:ecr:us-east-1:{account}:repository/*"
            ]
        },
        {
            "Sid": "IAMPolicy",
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DetachRolePolicy",
                "iam:GetRole",
                "iam:GetRolePolicy",
                "iam:PutRolePolicy"
            ],
            "Resource": [
                "arn:aws:iam::{account}:role/*"
            ]
        },
        {
            "Sid": "KMSPolicy",
            "Effect": "Allow",
            "Action": [
                "kms:GenerateDataKey"
            ],
            "Resource": [
                "arn:aws:kms:{region}:{account}:key/*",
                "arn:aws:kms:us-east-1:{account}:key/*"
            ]
        },
        {
            "Sid": "S3Policy",
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucketPolicy",
                "s3:GetBucketPolicy",
                "s3:PutBucketPublicAccessBlock",
                "s3:PutBucketPolicy",
                "s3:PutBucketVersioning",
                "s3:PutEncryptionConfiguration",
                "s3:ListAllMyBuckets"
            ],
            "Resource": [
                "arn:aws:s3:::*"
            ]
        },
        {
            "Sid": "STSPolicy",
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": [
                "arn:aws:iam::{account}:role/*"
            ]
        },
        {
            "Sid": "SecretsManagerPolicy",
            "Effect": "Allow",
            "Action": [
                "secretsmanager:PutSecretValue"
            ],
            "Resource": [
                "arn:aws:secretsmanager:{region}:{account}:secret:*"
            ]
        },
        {
            "Sid": "SSMPolicy",
            "Effect": "Allow",
            "Action": [
                "ssm:DeleteParameter",
                "ssm:PutParameter",
                "ssm:GetParameters",
                "ssm:GetParameter"
            ],
            "Resource": [
                "arn:aws:ssm:{region}:{account}:parameter/*",
                "arn:aws:ssm:us-east-1:{account}:parameter/*"
            ]
        },
        {
            "Sid": "CloudformationPolicy",
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateChangeSet",
                "cloudformation:DescribeChangeSet",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DeleteChangeSet",
                "cloudformation:DeleteStack",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:GetTemplate"
            ],
            "Resource": [
                "arn:aws:cloudformation:{region}:{account}:stack/*/*",
                "arn:aws:cloudformation:us-east-1:{account}:stack/*/*"
            ]
        }
    ]
}
```
