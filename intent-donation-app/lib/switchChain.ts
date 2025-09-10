export async function switchToChain(chain: {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}) {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not installed");
  }

  try {
    // coba langsung switch
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainId }],
    });
  } catch (err: any) {
    // kalau chain belum ada → tambahkan dulu
    if (err.code === 4902) {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [chain],
      });
    } else {
      throw err;
    }
  }
}
