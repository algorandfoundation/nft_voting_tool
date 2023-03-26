import { Body, Controller, Get, Path, Post, Route } from "tsoa";
import { inject, injectable } from "tsyringe";
import { Vote } from "../models/vote";
import { IIpfsService } from "../services/ipfsService";

@injectable()
@Route('vote-config')
export class VotingConfigurationController extends Controller {
    private ipfsService: IIpfsService;

    constructor(@inject("IIpfsService") ipfsService: IIpfsService) {
        super();
        this.ipfsService = ipfsService;
    }

    @Get("{cid}")
    public async getVoteConfigFile(@Path() cid: string): Promise<Vote> {
        return this.ipfsService.get<Vote>(cid);
    }

    @Post()
    public async postVoteConfigFile(@Body() vote: Vote): Promise<{ cid: string }> {
        return this.ipfsService.put(vote);
    }

}