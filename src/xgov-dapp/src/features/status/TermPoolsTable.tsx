import { Skeleton, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { GovenorTermPoolData, TermPool } from '../../shared/xGovApi'

interface TermPoolsTableProps {
  termPools: TermPool[]
  govenorData: GovenorTermPoolData[]
  isLoading: boolean
}

function TermPoolsTable({ termPools, govenorData, isLoading }: TermPoolsTableProps) {
  return (
    <>
      <div>
        <Typography variant="h4">Term Pools</Typography>
      </div>
      <div className="table w-full border-spacing-y-2">
        <div className="table-row">
          <div className="table-cell pl-4">
            <strong>Term</strong>
          </div>
          <div className="table-cell">
            <strong>Total Pool</strong>
          </div>
          <div className="table-cell">
            <strong>Your deposit</strong>
          </div>
          <div className="table-cell">
            <strong>Duration</strong>
          </div>
          <div className="table-cell">
            <strong>Earnings / Losses</strong>
          </div>
        </div>

        {!isLoading &&
          termPools?.length &&
          termPools.map((termPool) => {
            const termPoolGovenorData = govenorData.find((item) => item.pool === termPool.id)
            return (
              <div key={termPool.id} className="table-row bg-white">
                <div className="table-cell bg-white  pb-2 rounded-l-lg ">
                  <div className="py-4 pl-4">{termPool.name}</div>
                </div>
                <div className="table-cell bg-white">
                  <div className=" py-4">{parseInt(termPool.total_pool).toLocaleString()} mALGO</div>
                </div>
                <div className="table-cell bg-white ">
                  <div className="py-4">{termPoolGovenorData ? parseInt(termPoolGovenorData?.amount).toLocaleString() : 0} mALGO</div>
                </div>
                <div className="table-cell bg-white ">
                  <div className="py-4">
                    {dayjs(parseInt(termPool.start_date) * 1000).format('DD-MM-YYYY')} -{' '}
                    {dayjs(parseInt(termPool.end_date) * 1000).format('DD-MM-YYYY')}
                  </div>
                </div>
                <div className="table-cell bg-white rounded-r-lg">
                  <div className=" py-4">TBD</div>
                </div>
              </div>
            )
          })}
      </div>
      {isLoading && (
        <div>
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
          <Skeleton className="h-14 w-full mt-2" variant="rectangular" />
        </div>
      )}
    </>
  )
}

export default TermPoolsTable
