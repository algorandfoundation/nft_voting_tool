import { Controller, Get, Path, Route } from "tsoa";
import { injectable } from "tsyringe";

@injectable()
@Route('ipfs')
export class IpfsController extends Controller {
    @Get("{cid}")
    public async getIpfsFile(@Path() cid: string): Promise<string> {
        return "Hello from Controller"
    }
}