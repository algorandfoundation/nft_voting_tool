import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop(props: { offset?: number } = { offset: 0 }) {
  const { pathname } = useLocation()
  useEffect(() => {
    setTimeout(
      () =>
        window.scrollTo({
          top: typeof props.offset !== 'undefined' ? props.offset : 0,
          left: 0,
          behavior: 'smooth',
        }),
      25,
    )
  }, [pathname])

  return null
}
