import { useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = useRouteError() as any

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      {'statusText' in error && 'message' in error ? (
        <p>
          <i>{error.statusText || error.message}</i>
        </p>
      ) : (
        <div />
      )}
    </div>
  )
}
