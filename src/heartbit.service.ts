import { ConfigService } from '@nestjs/config';
import * as ABI from './abi.json';
import {
  ethers,
  type AlchemyProvider,
  type Wallet,
  type Signer,
  type Contract,
} from 'ethers';

import AddressMintInput from './dtos/address-mint.input';
import SignatureMintInput from './dtos/signature-mint.input';
import MintInput from './dtos/mint.input';
import MintResponse from './dtos/mint.response';

import RecoverAddressInput from './dtos/recover-address.input';
import RecoverAddressResponse from './dtos/recover-address.response';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HeartbitService {
  private readonly logger = new Logger(HeartbitService.name);

  private network: string;
  private alchemyApiKey: string;
  private privateKey: string;
  private contractAddress: string;
  private provider: AlchemyProvider;
  private wallet: Wallet;
  private signer: Signer;
  private contract: Contract;
  constructor(private readonly configService: ConfigService) {
    this.network = this.configService.get<string>('heartbit.network');
    this.alchemyApiKey = this.configService.get<string>(
      'heartbit.alchemyApiKey',
    );
    this.privateKey = this.configService.get<string>('heartbit.privateKey');
    this.contractAddress = this.configService.get<string>(
      'heartbit.contractAddress',
    );
    if (
      !this.network ||
      !this.alchemyApiKey ||
      !this.privateKey ||
      !this.contractAddress
    ) {
      throw new Error('Missing configuration');
    }
    this.provider = new ethers.AlchemyProvider(
      this.network,
      this.alchemyApiKey,
    );
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    this.signer = new ethers.NonceManager(this.wallet);
    this.contract = new ethers.Contract(this.contractAddress, ABI, this.signer);
  }

  mintHeartbit = async (input: MintInput): Promise<MintResponse> => {
    this.logger.debug(input);
    const txn = await this.contract.mint(
      input.account,
      input.startTime,
      input.endTime,
      input.hash,
      '0x00',
    );
    (async () => {
      await txn.wait();
    })();
    const response = { success: true, txnHash: txn.hash };
    this.logger.debug(response);
    return response;
  };

  addressMint = async (input: AddressMintInput): Promise<MintResponse> => {
    this.logger.debug(input);
    const response = await this.mintHeartbit(input);
    this.logger.debug(response);
    return response;
  };

  async recover(input: RecoverAddressInput): Promise<RecoverAddressResponse> {
    const data = await ethers.hashMessage(input.message);
    const account = await ethers.recoverAddress(data, input.signature);
    return { account };
  }

  signatureMint = async (input: SignatureMintInput): Promise<MintResponse> => {
    this.logger.debug(input);
    const { account } = await this.recover({
      message: input.message,
      signature: input.signature,
    });
    const response = await this.mintHeartbit({
      account,
      startTime: input.startTime,
      endTime: input.endTime,
      hash: input.hash,
    });
    this.logger.debug(response);
    return response;
  };
}
