export function handleError(error: any) {
  if (typeof error === 'string') {
    console.error(error)
  } else {
    console.error(error.message)
    console.error(error.stack)

    if (error.response) {
      console.error('Response body:')
      console.error(error.response.body)
    }
  }
}
