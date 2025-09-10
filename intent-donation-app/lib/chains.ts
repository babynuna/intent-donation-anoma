// lib/chains.ts
export type ChainInfo = {
  name: string;
  chainId: number;
  chainIdHex: string;
  rpcUrl: string;
  nativeSymbol: string;
  // Mengubah properti menjadi blockExplorerUrl agar konsisten dengan objek CHAINS
  blockExplorerUrl?: string; 
};

// gas estimate for native transfer
export const TRANSFER_GAS_LIMIT = 21000n;

export const CHAINS: ChainInfo[] = [
  {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrl: "https://rpc.sepolia.org",
    nativeSymbol: "ETH",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://sepolia.etherscan.io",
  },
  {
    name: "Polygon Mumbai",
    chainId: 80001,
    chainIdHex: "0x13881",
    rpcUrl: "https://rpc.ankr.com/polygon_mumbai",
    nativeSymbol: "MATIC",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://mumbai.polygonscan.com",
  },
  {
    name: "Fantom Testnet",
    chainId: 4002,
    chainIdHex: "0xfa2",
    rpcUrl: "https://rpc.testnet.fantom.network/",
    nativeSymbol: "FTM",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://testnet.ftmscan.com",
  },
  {
    name: "BSC Testnet",
    chainId: 97,
    chainIdHex: "0x61",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    nativeSymbol: "BNB",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://testnet.bscscan.com",
  },
  {
    name: "Arbitrum Sepolia",
    chainId: 421613,
    chainIdHex: "0x66eed",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    nativeSymbol: "ETH",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://sepolia.arbiscan.io",
  },
  {
    name: "Optimism Sepolia",
    chainId: 420,
    chainIdHex: "0x1a4",
    rpcUrl: "https://sepolia.optimism.io",
    nativeSymbol: "ETH",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
  },
  {
    name: "Base Sepolia",
    chainId: 84531,
    chainIdHex: "0x1487b",
    rpcUrl: "https://rpc.sepolia.base.org",
    nativeSymbol: "ETH",
    // Mengubah properti ini menjadi blockExplorerUrl
    blockExplorerUrl: "https://sepolia.basescan.org",
  },
];

/**
 * Fetch gas price from RPC endpoint
 */
export async function getGasPriceFromRpc(rpcUrl: string): Promise<bigint | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
    });
    const data = await res.json();
    if (data?.result) return BigInt(data.result);
  } catch (e) {
    console.error("RPC error:", rpcUrl, e);
  }
  return null;
}

/**
 * Return the chain with the cheapest estimated transfer cost
 */
export async function getCheapestChain(): Promise<{ chain: ChainInfo; gasPrice: bigint; estimatedCost: bigint } | null> {
  const promises = CHAINS.map(async (chain) => {
    const gasPrice = await getGasPriceFromRpc(chain.rpcUrl);
    if (!gasPrice) return null;
    return { chain, gasPrice, estimatedCost: gasPrice * TRANSFER_GAS_LIMIT };
  });

  const results = await Promise.all(promises);

  // Filter out null results
  const valid = results.filter((r): r is { chain: ChainInfo; gasPrice: bigint; estimatedCost: bigint } => r !== null);

  // Menambahkan pengecekan untuk memastikan array tidak kosong sebelum memanggil .reduce()
  if (valid.length === 0) {
    return null;
  }

  // Find the cheapest
  return valid.reduce((prev, curr) => (curr.estimatedCost < prev.estimatedCost ? curr : prev));
}