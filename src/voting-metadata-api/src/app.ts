import cors from 'cors'
import express, { Application, json, NextFunction, Request as ExRequest, Response as ExResponse, urlencoded } from 'express'
import 'reflect-metadata'
import { ValidateError } from 'tsoa'
import { RegisterRoutes } from '../routes/routes'
import { container } from './ioc'
import { HTTPResponseException } from './models/errors/httpResponseException'
import { AwsSecretsService } from './services/awsSecretsService'

export default function CreateApp(): Application {
  const app: Application = express()
  const env = process.env.NODE_ENV || 'development'
  if (env !== 'development') {
    container.resolve<AwsSecretsService>('AwsSecretsService').resolveSecrets()
  }
  // Use body parser to read sent json payloads
  app.use(
    urlencoded({
      extended: true,
    }),
  )
  app.use(json())
  app.use(cors())

  RegisterRoutes(app)

  app.use((_req, res: ExResponse) => {
    res.status(404).send({
      message: 'Not Found',
    })
  })

  app.use(function errorHandler(err: unknown, req: ExRequest, res: ExResponse, next: NextFunction): ExResponse | void {
    if (err instanceof ValidateError) {
      console.warn(`Caught Validation Error for ${req.path}:`, err.fields)
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      })
    }

    if (err instanceof HTTPResponseException) {
      return res.status(err.status).json({
        message: err.message,
      })
    }

    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message,
      })
    }

    next()
  })

  return app
}
