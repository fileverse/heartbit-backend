import { supportedChains } from "./supported-chains";

export default interface PimlicoConfig {
  apiKey: string;
  chain: keyof typeof supportedChains;
  rpcUrl: string;
}