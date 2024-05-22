import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
// import { HeartbitService } from './heartbit.service';
import AddressMint from './dtos/address-mint.input';
import SignatureMint from './dtos/signature-mint.input';
import MintResponse from './dtos/mint.response';
import { AuthGuard } from './auth/auth.gaurd';
import Pimlico  from './pimlico.service';

@Controller()
export class HeartbitController {
  constructor(
    // private readonly heartbitService: HeartbitService,
    private readonly pimlico: Pimlico,
  ) { }
  @Get()
  getStatus(): string {
    return 'Hello World!';
  }

  @Post('signed-mint')
  async signatureMint(@Body() body: SignatureMint): Promise<MintResponse> {
    const response = await this.pimlico.mint({
      // ToDo: validate if signature is account
      // if not then add code to recover account 
      account: body.signature, 
      startTime: body.startTime,
      endTime: body.endTime,
      hash: body.hash,
    })

    // Todo: Decide if we wanna keep the heartbit code or remove it
    // const response = await this.heartbitService.signatureMint(body);

    return response;
  }

  @UseGuards(AuthGuard)
  @Post()
  async addressMint(@Body() body: AddressMint): Promise<MintResponse> {
    const response = await this.heartbitService.addressMint(body);
    return response;
  }
}
