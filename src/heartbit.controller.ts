import { Controller, Post, Get, Body } from '@nestjs/common';
import { HeartbitService } from './heartbit.service';
import AddressMint from './dtos/address-mint.input';
import SignatureMint from './dtos/signature-mint.input';

@Controller()
export class HeartbitController {
  constructor(private readonly heartbitService: HeartbitService) {}
  @Get()
  getStatus(): string {
    return 'Hello World!';
  }

  @Post()
  async addressMint(@Body() body: AddressMint): Promise<any> {
    const response = await this.heartbitService.addressMint(body);
    return response;
  }

  @Post()
  async signatureMint(@Body() body: SignatureMint): Promise<any> {
    const response = await this.heartbitService.signatureMint(body);
    return response;
  }
}
