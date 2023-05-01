import * as algokit from '@algorandfoundation/algokit-utils'
import contract from './application.json'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import algosdk from 'algosdk'
import { ApplicationClient } from '@algorandfoundation/algokit-utils/types/app-client'
import {
  SendTransactionFrom,
  SendTransactionParams,
  TransactionNote,
  SendTransactionResult,
} from '@algorandfoundation/algokit-utils/types/transaction'
import { ResolveAppById } from '@algorandfoundation/algokit-utils/types/app-client'
import { ResolveAppByCreatorAndName } from '@algorandfoundation/algokit-utils/types/app-client'
import { ABIAppCallArgs } from '@algorandfoundation/algokit-utils/types/app'
import { AppCallTransactionResult } from '@algorandfoundation/algokit-utils/types/app'

export function decodeNamedTuple(v: algosdk.ABIValue | undefined, keys: string[]): object {
  if (v === undefined) return {}
  if (!Array.isArray(v)) throw Error('Expected array')
  if (v.length != keys.length) throw Error('Different key length than value length')

  return Object.fromEntries(
    keys.map((key, idx) => {
      return [key, v[idx]]
    }),
  )
}

export class VotingPreconditions {
  is_voting_open = BigInt(0)
  is_allowed_to_vote = BigInt(0)
  has_already_voted = BigInt(0)
  current_time = BigInt(0)

  static codec: algosdk.ABIType = algosdk.ABIType.from('(uint64,uint64,uint64,uint64)')
  static fields: string[] = ['is_voting_open', 'is_allowed_to_vote', 'has_already_voted', 'current_time']
  static decodeResult(val: algosdk.ABIValue | undefined): VotingPreconditions {
    return decodeNamedTuple(val, VotingPreconditions.fields) as VotingPreconditions
  }
  static decodeBytes(val: Uint8Array): VotingPreconditions {
    return decodeNamedTuple(VotingPreconditions.codec.decode(val), VotingPreconditions.fields) as VotingPreconditions
  }
}

export class VotingRoundAppClient {
  private _appSpec: AppSpec = contract as unknown as AppSpec
  private _client: ApplicationClient
  private _algod: algosdk.Algodv2
  private _defaultSender: SendTransactionFrom | undefined

  public get client(): ApplicationClient {
    return this._client
  }

  public get appSpec(): Readonly<AppSpec> {
    return this._appSpec
  }

  public get algod(): Readonly<algosdk.Algodv2> {
    return this._algod
  }

  public get defaultSender(): Readonly<SendTransactionFrom> | undefined {
    return this._defaultSender
  }

  public get compose(): VotingRoundAppClientComposer {
    return new VotingRoundAppClientComposer(this)
  }

  public composeWith(atc: algosdk.AtomicTransactionComposer): VotingRoundAppClientComposer {
    return new VotingRoundAppClientComposer(this, atc)
  }

  constructor(
    app: {
      sender?: SendTransactionFrom
      params?: algosdk.SuggestedParams
    } & (ResolveAppById | ResolveAppByCreatorAndName),
    algod: algosdk.Algodv2,
  ) {
    this._client = algokit.getAppClient(
      {
        ...app,
        app: this._appSpec,
      },
      algod,
    )
    this._algod = algod
    this._defaultSender = app.sender
  }

  public async get_preconditions(
    signature: Uint8Array,
    args?: {
      sender?: SendTransactionFrom
      note?: TransactionNote
      sendParams?: SendTransactionParams
    } & Omit<ABIAppCallArgs, 'method' | 'args'>,
  ): Promise<{ result: AppCallTransactionResult; return: VotingPreconditions }> {
    const result = await this._client.call({
      method: 'get_preconditions(byte[])(uint64,uint64,uint64,uint64)',
      methodArgs: {
        args: [signature],
        boxes: args?.boxes,
        lease: args?.lease,
      },
      ...(args ?? {}),
    })

    return {
      result,
      return: VotingPreconditions.decodeResult(result.return?.returnValue),
    }
  }
}

export class VotingRoundAppClientComposer {
  private _atc: algosdk.AtomicTransactionComposer
  private _client: VotingRoundAppClient
  private _actions: (() => Promise<void>)[]
  private _built: boolean

  constructor(client: VotingRoundAppClient, atc?: algosdk.AtomicTransactionComposer) {
    this._atc = atc ?? new algosdk.AtomicTransactionComposer()
    this._client = client
    this._actions = []
    this._built = false
  }

  public get_preconditions(
    signature: Uint8Array,
    args?: {
      sender?: SendTransactionFrom
      note?: TransactionNote
      sendParams?: SendTransactionParams
    } & Omit<ABIAppCallArgs, 'method' | 'args'>,
  ): VotingRoundAppClientComposer {
    if (this._built) {
      throw new Error(
        'Attempt to call method on VotingRoundAppClientComposer when the transactions have already been built',
      )
    }
    this._actions.push(async () => {
      await this._client.get_preconditions(signature, {
        ...(args ?? {}),
        sendParams: { ...(args?.sendParams ?? {}), atc: this._atc },
      })
    })
    return this
  }

  public addTransaction(
    transaction: algosdk.Transaction | Promise<SendTransactionResult>,
    sender?: SendTransactionFrom,
  ) {
    this._actions.push(async () => {
      this._atc.addTransaction({
        signer: algokit.getSenderTransactionSigner(this._client.defaultSender ?? sender),
        txn: 'then' in transaction ? (await transaction).transaction : transaction,
      })
    })

    return this
  }

  public build(): algosdk.TransactionWithSigner[] {
    this._built = true
    return this._atc.buildGroup()
  }

  public async execute(sendParams?: Omit<SendTransactionParams, 'fee' | 'maxFee' | 'skipSending' | 'atc'>) {
    this._built = true
    return algokit.sendAtomicTransactionComposer(
      {
        atc: this._atc,
        sendParams,
      },
      this._client.algod,
    )
  }
}

;async () => {
  const account1 = algokit.randomAccount()
  const account2 = algokit.randomAccount()
  const algod = algokit.getAlgoClient()
  const client = new VotingRoundAppClient(
    { creatorAddress: 'asdf', name: 'asdf', indexer: algokit.getAlgoIndexerClient() },
    algod,
  )

  const result1 = await client.get_preconditions(new Uint8Array())

  const result2 = await client.compose
    .get_preconditions(new Uint8Array())
    .addTransaction(
      algokit.transferAlgos({ amount: (100).algos(), from: account1, to: account2, skipSending: true }, algod),
    )
    .execute()
}
