import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { HeartbitService } from './heartbit.service';
import AddressMint from './dtos/address-mint.input';
import SignatureMint from './dtos/signature-mint.input';
import MintResponse from './dtos/mint.response';
import { AuthGuard } from './auth/auth.gaurd';

@Controller()
export class HeartbitController {
  constructor(private readonly heartbitService: HeartbitService) {}
  @Get()
  getStatus(): string {
    return 'Hello World!';
  }

  @Post()
  async signatureMint(@Body() body: SignatureMint): Promise<MintResponse> {
    const response = await this.heartbitService.signatureMint(body);
    return response;
  }

  @UseGuards(AuthGuard)
  @Post()
  async addressMint(@Body() body: AddressMint): Promise<MintResponse> {
    const response = await this.heartbitService.addressMint(body);
    return response;
  }
}
