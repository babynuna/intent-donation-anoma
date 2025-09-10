// lib/chains.ts
import { BigNumber } from "ethers";

export interface ChainInfo {
  name: string;
  chainId: number;
  chainIdHex: string;
  rpcUrl: string;
  nativeSymbol: string;
  blockExplorerUrl: string;
}


export const TRANSFER_GAS_LIMIT = BigNumber.from(21000);


const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || "";
if (!ALCHEMY_KEY) {
  
}

export const CHAINS: ChainInfo[] = [
  {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.etherscan.io",
  },
  {
    name: "Polygon Amoy",
    chainId: 80002,
    chainIdHex: "0x13882",
    rpcUrl: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "MATIC",
    blockExplorerUrl: "https://amoy.polygonscan.com",
  },
  {
    name: "Optimism Sepolia",
    chainId: 11155420,
    chainIdHex: "0xaa37dc",
    rpcUrl: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
  },
  {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    chainIdHex: "0x66eee",
    rpcUrl: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.arbiscan.io",
  },
  {
    name: "Base Sepolia",
    chainId: 84532,
    chainIdHex: "0x14a34",
    rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.basescan.org",
  },
  {
    name: "Blast Sepolia",
    chainId: 168587773,
    chainIdHex: "0xaef3c05",
    rpcUrl: `https://blast-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.blastscan.io",
  },
  {
    name: "Linea Sepolia",
    chainId: 59141,
    chainIdHex: "0xe704d",
    rpcUrl: `https://linea-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.lineascan.build",
  },
  {
    name: "Zora Sepolia",
    chainId: 999999999,
    chainIdHex: "0x3b9ac9ff",
    rpcUrl: `https://zora-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.explorer.zora.energy",
  },
  {
    name: "Ink Sepolia",
    chainId: 763373,
    chainIdHex: "0xba32d",
    rpcUrl: `https://ink-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://explorer-sepolia.inkonchain.com",
  },
  {
    name: "Unichain Sepolia",
    chainId: 1301,
    chainIdHex: "0x515",
    rpcUrl: `https://unichain-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://sepolia.uniscan.xyz",
  },
  {
    name: "Monad Testnet",
    chainId: 10143,
    chainIdHex: "0x278f",
    rpcUrl: `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "MON",
    blockExplorerUrl: "https://explorer.monad.xyz",
  },
  {
    name: "Rise Testnet",
    chainId: 1918988905,
    chainIdHex: "0x72697365",
    rpcUrl: `https://rise-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    blockExplorerUrl: "https://explorer.risetest.io",
  },
];

//
// RPC helper
//

/**
 * Fetch gas price from RPC endpoint (returns BigNumber or null)
 */
export async function getGasPriceFromRpc(rpcUrl: string): Promise<BigNumber | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
    });
    const data = await res.json();
    if (data?.result && typeof data.result === "string") {
      // BigNumber.from menerima hex string seperti "0x..."
      return BigNumber.from(data.result);
    }
  } catch (e) {
    console.error("RPC error:", rpcUrl, e);
  }
  return null;
}

//
// cheapest finder
//

export type CheapestChainResult = {
  chain: ChainInfo;
  gasPrice: BigNumber;
  estimatedCost: BigNumber;
};

/**
 * Return the chain with the cheapest estimated transfer cost
 */
export async function getCheapestChain(): Promise<CheapestChainResult | null> {
  try {
    const promises: Promise<CheapestChainResult | null>[] = CHAINS.map(
      async (chain): Promise<CheapestChainResult | null> => {
        const gasPrice = await getGasPriceFromRpc(chain.rpcUrl);
        if (!gasPrice) return null;
        const estimatedCost = gasPrice.mul(TRANSFER_GAS_LIMIT); // BigNumber mul
        return { chain, gasPrice, estimatedCost };
      }
    );

    const results = await Promise.all(promises);

    const valid = results.filter((r): r is CheapestChainResult => r !== null);

    if (valid.length === 0) return null;

    // gunakan .lt() untuk BigNumber comparison
    return valid.reduce((prev, curr) => (curr.estimatedCost.lt(prev.estimatedCost) ? curr : prev));
  } catch (err) {
    console.error("getCheapestChain error:", err);
    return null;
  }
}
