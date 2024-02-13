import { ConfigService } from '@nestjs/config';
import * as ABI from './abi.json';
import {
  type Address,
  createPublicClient,
  encodeFunctionData,
  http,
  recoverMessageAddress,
} from 'viem';

import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';

import { privateKeyToSafeSmartAccount } from 'permissionless/accounts';
import { bundlerActions, createSmartAccountClient } from 'permissionless';
import { pimlicoBundlerActions } from 'permissionless/actions/pimlico';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const apiKey = process.env.PIMLICO_API_KEY;
const paymasterUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;
const bundlerUrl = `https://api.pimlico.io/v1/sepolia/rpc?apikey=${apiKey}`;

import AddressMintInput from './dtos/address-mint.input';
import SignatureMintInput from './dtos/signature-mint.input';
import MintInput from './dtos/mint.input';
import MintResponse from './dtos/mint.response';

import RecoverAddressInput from './dtos/recover-address.input';
import RecoverAddressResponse from './dtos/recover-address.response';

import { Injectable } from '@nestjs/common';

@Injectable()
export class HeartbitService {
  private privateKey: string;
  private contractAddress: Address;
  constructor(private readonly configService: ConfigService) {
    const contractAddress = this.configService.get<string>(
      'heartbit.contarctAddress',
    );
    this.contractAddress = contractAddress as any;
  }

  mintHeartbit = async (input: MintInput): Promise<MintResponse> => {
    console.log(input);
    const entryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
    const paymasterClient = createPimlicoPaymasterClient({
      transport: http(paymasterUrl),
    });
    const publicClient = createPublicClient({
      transport: http('https://rpc.ankr.com/eth_sepolia'),
      chain: sepolia,
    });
    const signer = privateKeyToAccount(this.privateKey as any);

    const safeAccount = await privateKeyToSafeSmartAccount(publicClient, {
      signer: signer,
      safeVersion: '1.4.1',
      entryPoint, // global entrypoint
    });
    console.log(safeAccount.address);
    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain: sepolia,
      transport: http(bundlerUrl),
      sponsorUserOperation: paymasterClient.sponsorUserOperation,
    })
      .extend(bundlerActions)
      .extend(pimlicoBundlerActions);
    const callData = await safeAccount.encodeCallData({
      to: this.contractAddress,
      data: encodeFunctionData({
        abi: ABI,
        functionName: 'mint',
        args: [
          input.account,
          input.startTime,
          input.endTime,
          input.hash,
          '0x00',
        ],
      }),
      value: BigInt(0),
    });

    const userOperation = await smartAccountClient.prepareUserOperationRequest({
      userOperation: {
        callData, // callData is the only required field in the partial user operation
      },
      account: safeAccount,
    });
    userOperation.signature =
      await safeAccount.signUserOperation(userOperation);
    const txnHash = await smartAccountClient.sendUserOperation({
      userOperation,
      entryPoint,
    });
    return { success: true, txnHash };
  };

  addressMint = async (input: AddressMintInput): Promise<MintResponse> => {
    const response = await this.mintHeartbit(input);
    return response;
  };

  async recover(input: RecoverAddressInput): Promise<RecoverAddressResponse> {
    const account = await recoverMessageAddress({
      message: input.message,
      signature: input.signature as any,
    });
    return { account };
  }

  signatureMint = async (input: SignatureMintInput): Promise<MintResponse> => {
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
