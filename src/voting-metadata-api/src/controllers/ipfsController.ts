import { Readable } from 'stream'
import { Controller, Get, Path, Post, Route, Security, UploadedFile } from 'tsoa'
import { inject, injectable } from 'tsyringe'
import { IIpfsService } from '../services/ipfsService'

@injectable()
@Route('ipfs')
export class IpfsController extends Controller {
  private ipfsService: IIpfsService

  constructor(@inject('IIpfsService') ipfsService: IIpfsService) {
    super()
    this.ipfsService = ipfsService
  }

  @Get('{cid}')
  public async get(@Path() cid: string): Promise<Readable> {
    const [buffer, mimeType] = await this.ipfsService.getBuffer(cid)
    this.setHeader('Content-Type', mimeType)
    this.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return Readable.from(buffer)
  }

  @Security('AlgorandSignature')
  @Post()
  public async post(@UploadedFile() file: Express.Multer.File): Promise<{ cid: string }> {
    return this.ipfsService.putBuffer(file.buffer, file.mimetype)
  }
}
