import { Body, Controller, Get, Path, Post, Route } from "tsoa";
import { inject, injectable } from "tsyringe";
import { Snapshot } from "../models/snapshot";
import { Vote } from "../models/vote";
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
    public async getWalletSnapshotFile(@Path() cid: string): Promise<Snapshot> {
        return this.ipfsService.get<Vote>(cid);
    }

    @Post()
    public async postWalletSnapshot(@Body() snapshot: Snapshot): Promise<{ cid: string }> {
        return this.ipfsService.put(snapshot);
    }
}