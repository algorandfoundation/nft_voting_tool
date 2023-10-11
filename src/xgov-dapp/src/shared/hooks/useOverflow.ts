import React, { useLayoutEffect } from 'react'
import type { MutableRefObject } from 'react'

export const useOverflow = (ref: MutableRefObject<HTMLElement | null>, callback?: (hasOverflow: boolean) => boolean) => {
  const [isOverflow, setIsOverflow] = React.useState<boolean | undefined>(undefined)

  useLayoutEffect(() => {
    const { current } = ref

    const trigger = () => {
      if (!current) return
      const hasOverflow = current.scrollHeight > current.clientHeight

      setIsOverflow(hasOverflow)

      if (callback) callback(hasOverflow)
    }

    if (current) {
      trigger()
    }
  }, [callback, ref])

  return isOverflow
}
