import serverless from 'serverless-http'
import CreateApp from './app'

const app = CreateApp()
export const handler = serverless(app)
