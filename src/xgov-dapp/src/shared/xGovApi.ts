export interface TermPool {
  id: string
  name: string
  end_date: string
  start_date: string
  total_pool: string
}

export interface GovenorTermPoolData {
  controller_address: string
  inception: string
  original_voting_power: string
  amount: string
  current_voting_power: string
  eligibility: string
  address: string
  traceID: string
  pool: string
}

export async function fetchGovenorData(address: string) {
  const res = await fetch(`https://governors.xgov-dev.algorandfoundation.tools/address/${address}`)
  if (res.status === 404) {
    return null
  } else {
    const resJson = await res.json()
    const sortedData: GovenorTermPoolData[] = resJson.sort(
      (a: GovenorTermPoolData, b: GovenorTermPoolData) => parseInt(a.inception, 10) - parseInt(b.inception, 10),
    )
    return sortedData
  }
}

export async function fetchTermPools() {
  const res = await fetch(`https://periods.xgov-dev.algorandfoundation.tools/term-pool`)
  const resJson = await res.json()
  const sortedData: TermPool[] = resJson.sort((a: TermPool, b: TermPool) => parseInt(a.start_date, 10) - parseInt(b.start_date, 10))
  return sortedData
}
