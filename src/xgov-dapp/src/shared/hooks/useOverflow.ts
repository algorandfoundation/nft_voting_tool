import { useLayoutEffect, useRef, useState } from 'react'

export const useOverflow = (onChange?: (isOverflow: boolean) => void) => {
  const [isOverflow, setIsOverflow] = useState<boolean>()
  const ref = useRef<HTMLElement>()
  useLayoutEffect(() => {
    const { current } = ref
    if (!current) {
      return
    }
    const hasOverflow = current.scrollHeight > current.clientHeight

    setIsOverflow(hasOverflow)

    if (onChange) onChange(hasOverflow)
  }, [onChange, ref])

  return { ref, isOverflow }
}
