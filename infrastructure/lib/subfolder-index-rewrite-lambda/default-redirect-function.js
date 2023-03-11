/* eslint-disable */
// ^^^ cloudfront functions do not support let, const export etc !
// https://docs.astro.build/en/guides/deploy/aws/#cloudfront-functions-setup
function handler(event) {
  var request = event.request
  var uri = request.uri

  // Check whether the URI is missing a file name.
  if (uri.endsWith('/')) {
    request.uri += 'index.html'
  }
  // Check whether the URI is missing a file extension.
  else if (!uri.includes('.')) {
    request.uri += '/index.html'
  }

  return request
}

