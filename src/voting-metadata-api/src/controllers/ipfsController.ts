import { Controller, Get, Path, Post, Route, UploadedFile } from "tsoa";
import { inject, injectable } from "tsyringe";
import { IIpfsService } from "../services/ipfsService";

@injectable()
@Route('ipfs')
export class IpfsController extends Controller {
    private ipfsService: IIpfsService;

    constructor(@inject("IIpfsService") ipfsService: IIpfsService) {
        super();
        this.ipfsService = ipfsService;
    }

    @Get("{cid}")
    public async getWalletSnapshotFile(@Path() cid: string): Promise<Buffer> {
        const [buffer, mimeType] = await this.ipfsService.getBuffer(cid);
        this.setHeader("Content-Type", mimeType);
        return Promise.resolve(buffer);
    }

    @Post()
    public async postWalletSnapshot(@UploadedFile() snapshot: Express.Multer.File): Promise<{ cid: string }> {
        return this.ipfsService.putBuffer(snapshot.buffer, snapshot.mimetype);
    }
}