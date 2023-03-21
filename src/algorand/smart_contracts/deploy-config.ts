import {
  AlgoAmount,
  getAccount,
  getAlgoClient,
  getAlgoIndexerClient,
  isLocalNet,
  transferAlgos,
  ApplicationClient,
} from '@algorandfoundation/algokit-utils'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/appspec'
import * as ed from '@noble/ed25519'
import algosdk from 'algosdk'

// Edit this to add in your contracts
export const contracts = ['VotingRoundApp'] as const

export async function deploy(name: (typeof contracts)[number], appSpec: AppSpec) {
  const algod = getAlgoClient()
  const indexer = getAlgoIndexerClient()
  const deployer = await getAccount({ name: 'DEPLOYER', fundWith: AlgoAmount.Algos(1000) }, algod)
  const isLocal = await isLocalNet(algod)
  const appClient = new ApplicationClient(
    {
      app: appSpec,
      sender: deployer,
      creatorAddress: deployer.addr,
    },
    algod,
    indexer,
  )

  switch (name) {
    // Edit this to add the custom deployment logic for each contract
    case 'VotingRoundApp':
      if (!isLocal) {
        throw new Error(`This deployment handler is only for local development.`)
      }

      //const privateKey = Buffer.from(ed.utils.randomPrivateKey()).toString('base64')
      //console.log(privateKey)
      // Hard-code the private key so it works for subsequent runs
      const privateKey = Buffer.from('ja126KrhZHWYfH/hv5Y6y52QQUyPfU7sFLsm0ywtRMI=', 'base64')
      const publicKey = await ed.getPublicKey(privateKey)

      const app = await appClient.deploy({
        version: '1.0',
        allowDelete: isLocal,
        allowUpdate: isLocal,
        onSchemaBreak: isLocal ? 'replace' : 'fail',
        onUpdate: isLocal ? 'replace' : 'fail',
        createArgs: {
          method: appClient.getABIMethod('create')!,
          args: [publicKey],
        },
      })
      // If app was just created fund the app account so it can issue opup
      if (app.operationPerformed === 'create') {
        transferAlgos(
          {
            amount: AlgoAmount.Algos(1),
            from: deployer,
            to: app.appAddress,
          },
          algod,
        )
      }
      // Generate some dummy data using the public key
      const decoded = algosdk.decodeAddress(deployer.addr)
      const signature = await ed.sign(decoded.publicKey, privateKey)

      // Call verify to check it works
      const result = await appClient.call({ method: 'verify', methodArgs: [signature], callType: 'normal' })
      console.log(result.return?.returnValue)
      break
    default:
      throw new Error(`Attempt to deploy unknown contract ${name}`)
  }
}
