import dayjs from 'dayjs'
import advanced from 'dayjs/plugin/advancedFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(localizedFormat)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(advanced)

export const getTimezone = (date: ReturnType<typeof dayjs>) => {
  const utcOffset = dayjs(date).utcOffset() / 60
  return `(UTC${utcOffset > 0 ? '+' : utcOffset < 0 ? '-' : ''}${utcOffset !== 0 ? utcOffset : ''})`
}
