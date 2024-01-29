import { Readable } from 'stream'
import { Controller, Get, Path, Post, Route, Security, UploadedFile } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { IIpfsService } from '../services/ipfsService.js'
import { NotFoundException, ServiceException } from '../models/errors/httpResponseException.js'

@injectable()
@Route('ipfs')
export class IpfsController extends Controller {
  private ipfsService: IIpfsService

  constructor(@inject('IIpfsService') ipfsService: IIpfsService) {
    super()
    this.ipfsService = ipfsService
  }

  @Get('{cid}')
  public async get(@Path() cid: string): Promise<Readable | NotFoundException> {
    try {
      const buffer = await this.ipfsService.getBuffer(cid)
      this.setHeader('Content-Type', 'application/json')
      this.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return Readable.from(buffer)
    } catch (_) {
      return new NotFoundException('Resource not found!')
    }
  }

  @Security('AlgorandSignature')
  @Post()
  public async post(@UploadedFile() file: Express.Multer.File): Promise<{ cid: string } | ServiceException | Error> {
    try {
      return this.ipfsService.putFile(file)
    } catch (e) {
      return new ServiceException((e as Error).message)
    }
  }
}
