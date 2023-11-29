import * as algokit from '@algorandfoundation/algokit-utils'
import { useQuery } from '@tanstack/react-query'

const indexer = algokit.getAlgoIndexerClient({
  server: import.meta.env.VITE_INDEXER_SERVER,
  port: import.meta.env.VITE_INDEXER_PORT,
  token: import.meta.env.VITE_INDEXER_TOKEN,
})
export default function useApplicationsQuery(addresses: string[]) {
  // TODO: strongly type
  return useQuery(['applications', addresses], () => {
    // TODO: filter excluded applications
    return Promise.all(addresses.map((address) => indexer.lookupAccountCreatedApplications(address).do()))
  })
}
