import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class CloudFlareIPFSService {
  async getBuffer(cid: string): Promise<[Buffer, string]> {
    const response = await axios.get(`https://${cid}.ipfs.cf-ipfs.com/`, {
      responseType: 'arraybuffer',
    })
    const mimeType = (response.headers['content-type'] as string) ?? 'application/octet-stream'
    const buffer = (await response.data) as ArrayBuffer
    return Promise.resolve([Buffer.from(buffer), mimeType])
  }

  async get<T>(cid: string): Promise<T> {
    const response = await axios.get(`https://${cid}.ipfs.cf-ipfs.com/`)
    const json = await response.data.json()
    return json as T
  }
}
