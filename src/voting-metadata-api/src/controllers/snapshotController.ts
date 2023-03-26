import { Controller, Get, Path, Post, Route, UploadedFile } from "tsoa";
import { inject, injectable } from "tsyringe";
import { IIpfsService } from "../services/ipfsService";

@injectable()
@Route('wallet-snapshot')
export class SnapshotController extends Controller {
    private ipfsService: IIpfsService;

    constructor(@inject("IIpfsService") ipfsService: IIpfsService) {
        super();
        this.ipfsService = ipfsService;
    }

    @Get("{cid}")
    public async getWalletSnapshotFile(@Path() cid: string): Promise<Express.Multer.File> {
        return this.ipfsService.get<Express.Multer.File>(cid);
    }

    @Post()
    public async postWalletSnapshot(@UploadedFile() snapshot: Express.Multer.File): Promise<{ cid: string }> {
        return this.ipfsService.put<Express.Multer.File>(snapshot);
    }
}