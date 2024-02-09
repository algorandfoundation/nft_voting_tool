import serverless from 'serverless-http'
import CreateApp from './app.js'

const app = CreateApp()
export const handler = serverless(app)
