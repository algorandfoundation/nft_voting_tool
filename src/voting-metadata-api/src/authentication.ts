import { addMinutes, isWithinInterval } from 'date-fns'
import * as express from 'express'
import { ForbiddenException } from './models/errors/httpResponseException.js'
import { verifyAlgorandTransaction } from './services/algorandSignatureService.js'

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export function expressAuthentication(request: express.Request, securityName: string, scopes?: string[]): Promise<any> {
  const allowedAddresses = process.env.ALLOWED_ADDRESSES?.split(',') || []

  if (securityName === 'AlgorandSignature') {
    const signedTransaction: string = request.headers['x-algorand-signed-txn'] as string
    // todo: remove this header
    const address: string = request.headers['x-algorand-address'] as string

    return new Promise((resolve, reject) => {
      if (!signedTransaction || !address || (!allowedAddresses.includes(address) && process.env.ALLOWED_ADDRESSES !== 'any')) {
        reject(new ForbiddenException('No signature provided'))
      }
      const auth = verifyAlgorandTransaction(address, signedTransaction)
      if (auth.error || !auth.signatureValid) {
        reject(new ForbiddenException('Invalid signature'))
        return
      }

      // Doesn't test for a valid date, but ensures the pattern is right
      const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      if (!auth.data?.timestamp || typeof auth.data.timestamp !== 'string' || !iso8601Pattern.test(auth.data.timestamp)) {
        reject(new ForbiddenException('No valid timestamp found in signed auth transaction'))
        return
      }

      const now = new Date()
      const timestamp = new Date(auth.data.timestamp)
      if (
        !isWithinInterval(timestamp, {
          start: addMinutes(now, -5),
          end: addMinutes(now, 5),
        })
      ) {
        reject(new ForbiddenException('Invalid timestamp'))
        return
      }

      resolve(auth.signatureValid)
    })
  }
  return Promise.reject({})
}
