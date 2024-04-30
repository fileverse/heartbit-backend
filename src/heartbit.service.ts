import { ConfigService } from '@nestjs/config';
import * as ABI from './abi.json';
import {
  ethers,
  type AlchemyProvider,
  type JsonRpcProvider,
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
  private gnosisRpc: string;
  private privateKey: string;
  private contractAddress: string;
  private provider: AlchemyProvider | JsonRpcProvider;
  private wallet: Wallet;
  private signer: Signer;
  private contract: Contract;
  private nonceOffset: number;
  constructor(private readonly configService: ConfigService) {
    this.network = this.configService.get<string>('heartbit.network');
    this.alchemyApiKey = this.configService.get<string>(
      'heartbit.alchemyApiKey',
    );
    this.gnosisRpc = this.configService.get<string>('heartbit.gnosisRpc');
    this.privateKey = this.configService.get<string>('heartbit.privateKey');
    this.contractAddress = this.configService.get<string>(
      'heartbit.contractAddress',
    );

    if (this.network === 'gnosis' && !this.gnosisRpc) {
      throw new Error('Missing gnosis configuration');
    }

    if (this.network !== 'gnosis' && !this.alchemyApiKey) {
      throw new Error('Missing rpc configuration');
    }

    if (!this.privateKey || !this.contractAddress) {
      throw new Error('Missing contract configuration');
    }

    if (!this.network || !this.privateKey || !this.contractAddress) {
      throw new Error('Missing configuration');
    }
    if (this.network !== 'gnosis') {
      this.provider = new ethers.AlchemyProvider(
        this.network,
        this.alchemyApiKey,
      );
    } else {
      this.provider = new ethers.JsonRpcProvider(this.gnosisRpc);
    }
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    this.signer = new ethers.NonceManager(this.wallet);
    this.contract = new ethers.Contract(this.contractAddress, ABI, this.signer);
    this.nonceOffset = 0;
  }


  getNonce = async () => {
    const baseNonce = this.provider.getTransactionCount(this.wallet.address);
    return baseNonce.then((nonce) => nonce + this.nonceOffset++);
  };

  mintHeartbit = async (input: MintInput): Promise<MintResponse> => {
    this.logger.debug(input);

    const txn = await this.contract.mint(
      input.account,
      input.startTime,
      input.endTime,
      input.hash,
      '0x00',
      {
        nonce: await this.getNonce(),
      }
    );
    (async () => {
      const txnReciept = await txn.wait();
      this.logger.log(txnReciept);
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
