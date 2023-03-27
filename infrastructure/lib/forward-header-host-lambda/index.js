/* eslint-disable */
// ^^^ cloudfront functions do not support let, const export etc !
function handler(event) {
  var request = event.request

  // Forward host header via X-Forwarded-Host
  request.headers['x-forwarded-host'] = {
    value: request.headers['host'].value,
  }

  return request
}
