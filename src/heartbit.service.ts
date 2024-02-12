import { ConfigService } from '@nestjs/config';
import * as ABI from './abi.json';
import {
  ethers,
  type AlchemyProvider,
  type Wallet,
  type Signer,
  type Contract,
} from 'ethers';
import { Injectable } from '@nestjs/common';

interface RecoverAddressInput {
  message: string;
  signature: string;
}

interface RecoverAddressResponse {
  account: string;
}

interface MintHeartbitInput {
  account: string;
  startTime: number;
  endTime: number;
  hash: string;
}

interface MintHeartbitResponse {
  success: boolean;
  txnHash?: string;
  message?: string;
}

interface AddressMintInput {
  account: string;
  startTime: number;
  endTime: number;
  hash: string;
}

interface SignatureMintInput {
  message: string;
  signature: string;
  startTime: number;
  endTime: number;
  hash: string;
}

@Injectable()
export class HeartbitService {
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

  mintHeartbit = async (input: MintHeartbitInput) => {
    const txn = await this.contract.mint(
      input.account,
      input.startTime,
      input.endTime,
      input.hash,
      '0x00',
    );
    return { success: true, txnHash: txn.hash, txn };
  };

  addressMint = async (
    input: AddressMintInput,
  ): Promise<MintHeartbitResponse> => {
    const response = await this.mintHeartbit(input);
    return response;
  };

  async recover(input: RecoverAddressInput): Promise<RecoverAddressResponse> {
    const data = await ethers.hashMessage(input.message);
    const account = await ethers.recoverAddress(data, input.signature);
    return { account };
  }

  signatureMint = async (
    input: SignatureMintInput,
  ): Promise<MintHeartbitResponse> => {
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
    return response;
  };
}
