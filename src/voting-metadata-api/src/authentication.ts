import * as express from 'express'
import { ForbiddenException } from './models/errors/httpResponseException'
import { algoVerifyMessage, getAlgorandTransactionAttributes } from './services/algorandSignatureService'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function expressAuthentication(request: express.Request, securityName: string, scopes?: string[]): Promise<any> {
  try {
    const allowedAddresses = process.env.ALLOWED_ADDRESSES?.split(',') || []
    if (securityName === 'AlgorandSignature') {
      const txn: string = request.headers['X-ALGORAND-TRANSACTION'] as string
      if (!txn) {
        return Promise.reject(new ForbiddenException('No transaction provided'))
      }
      return new Promise((resolve, reject) => {
        const txnArgs = getAlgorandTransactionAttributes(txn)
        if (!allowedAddresses.includes(txnArgs.address)) {
          reject(new ForbiddenException('Address not allowed'))
        }
        const [auth, error] = algoVerifyMessage(txnArgs.address, txnArgs.message, txnArgs.signature)
        if (!auth) {
          reject(new ForbiddenException(error?.message || 'Could not verify Transaction signature'))
        }
        resolve(auth)
      })
    }
  } catch (e: unknown) {
    return Promise.reject(new ForbiddenException(''))
  }
  return Promise.reject(new ForbiddenException(''))
}
