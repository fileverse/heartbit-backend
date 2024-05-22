import { createPublicClient, encodeFunctionData, http } from "viem";
import { toBytes, toHex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import abi from "./abi.json";

import {
  createPimlicoPaymasterClient,
  createPimlicoBundlerClient,
} from "permissionless/clients/pimlico";

import { privateKeyToSafeSmartAccount } from "permissionless/accounts";
import {
  bundlerActions,
  createSmartAccountClient,
  getAccountNonce,
} from "permissionless";
import { pimlicoBundlerActions } from "permissionless/actions/pimlico";
import { sepolia, base, Chain } from "viem/chains";

import PimlicoConfig from "./dtos/pimlico-config";
import CallDataParams from "./dtos/call-data-params";
import MintParams from "./dtos/mint-params";
import MintResponse from "./dtos/mint.response";
import { supportedChains } from "./dtos/supported-chains";

import {ENTRYPOINT_ADDRESS_V06_TYPE} from "permissionless/types/entrypoint";

interface UserOperationReceiptParams {
  txnHash: string;
}

function resolveViemChainInstance(chain: keyof typeof supportedChains): Chain | null {
    switch (chain) {
        case supportedChains.SEPOLIA:
            return sepolia;
        case supportedChains.BASE:
            return base as Chain; 
        default:
            return null;
    }
}

class Pimlico {
  name: string;
  entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE;
  rpcUrl: string;
  hasAgent: boolean;
  chain: Chain;
  paymasterUrl: string;
  bundlerUrl: string;
  key: number | undefined;
  paymasterClient: any;
  bundlerClient: any;
  publicClient: any;
  safeAccount: any;
  nonce: any;
  smartAccountClient: any;

  constructor({ apiKey, chain, rpcUrl }: PimlicoConfig) {
    this.name = "Pimlico";
    this.entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as ENTRYPOINT_ADDRESS_V06_TYPE;
    this.rpcUrl = rpcUrl;
    this.hasAgent = false;
    this.chain = resolveViemChainInstance(chain);
    if (!this.chain) {
      throw new Error("unsupported chains: should be either base or sepolia");
    }
    this.paymasterUrl = `https://api.pimlico.io/v2/${chain}/rpc?apikey=${apiKey}`;
    this.bundlerUrl = `https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`;
  }

  async setup() {
    this.hasAgent = true;
    this.key = 0;
      this.paymasterClient = createPimlicoPaymasterClient({
          transport: http(this.paymasterUrl),
          entryPoint: this.entryPoint,
      });

    this.bundlerClient = createPimlicoBundlerClient({
        transport: http(this.bundlerUrl),
        entryPoint: this.entryPoint,
    });

    this.publicClient = createPublicClient({
      transport: http(this.rpcUrl),
      chain: this.chain,
    });

    this.safeAccount = await privateKeyToSafeSmartAccount(this.publicClient, {
      privateKey: process.env.PRIVATE_KEY as `0x${string}`,
      safeVersion: "1.4.1",
      entryPoint: this.entryPoint, // global entrypoint
      address: process.env.PIMLICO_ADDRESS as `0x${string}`,
    });

      this.nonce = await getAccountNonce(this.publicClient, {
          sender: this.safeAccount.address,
          entryPoint: this.entryPoint,
      });

      this.smartAccountClient = createSmartAccountClient({
          account: this.safeAccount,
          entryPoint: this.entryPoint,
          chain: sepolia,
          bundlerTransport: http(this.bundlerUrl),
          middleware: {
              sponsorUserOperation: this.paymasterClient.sponsorUserOperation,
          }
      });
  }

  async getCallData({ account, startTime, endTime, hash }: CallDataParams) {
    const callData = await this.safeAccount.encodeCallData({
      to: process.env.CONTRACT_ADDRESS as string,
      data: encodeFunctionData({
        abi: abi,
        functionName: "mint",
        args: [account, startTime, endTime, hash, "0x00"],
      }),
      value: BigInt(0),
    });
    return callData;
  }

  async waitForUserOperationReceipt({ txnHash }: UserOperationReceiptParams) {
    console.log('waitForUserOperationReceipt :', txnHash);
    return await this.smartAccountClient.waitForUserOperationReceipt({ hash: txnHash });
  }

  async mint({ account, startTime, endTime, hash }: MintParams): Promise<MintResponse>  {
    if (this.hasAgent === false) {
      await this.setup();
    }
    const callData = await this.getCallData({
      account,
      startTime,
      endTime,
      hash,
    });

    const gasPrices = await this.bundlerClient.getUserOperationGasPrice();
    const userOperation = await this.smartAccountClient.prepareUserOperationRequest({
      userOperation: {
        callData, // callData is the only required field in the partial user operation
        nonce: toHex(toBytes(generatePrivateKey()).slice(0, 24), { size: 32 }),
        maxFeePerGas: gasPrices.fast.maxFeePerGas, // if using Pimlico
        maxPriorityFeePerGas: gasPrices.fast.maxPriorityFeePerGas, // if using Pimlico
      },
      account: this.safeAccount,
    });

    userOperation.signature = await this.safeAccount.signUserOperation(userOperation);
    const txnHash = await this.smartAccountClient.sendUserOperation({
      userOperation,
      entryPoint: this.entryPoint,
    });

    this.waitForUserOperationReceipt({ txnHash }).then(console.log);
    return { success: true, txnHash };
  }
}

export default Pimlico;