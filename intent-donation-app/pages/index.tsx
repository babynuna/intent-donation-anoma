import { useState } from "react";
import { getCheapestChain } from "../lib/chains";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import Image from "next/image";


 interface ChainInfo {
  chain: {
    name: string;
    nativeSymbol: string;
    chainIdHex: string;
  };
  estimatedCost: string | number | bigint | ethers.BigNumber;
}


// tipe ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: Array<unknown> }) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export default function Home() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [cheapest, setCheapest] = useState<ChainInfo | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("MetaMask not found!");
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setWallet(accounts[0]);
      toast.success("Wallet connected!");
    } catch (e) {
      toast.error("Failed to connect wallet");
      console.error(e);
    }
  };

  const findCheapest = async () => {
    setBusy(true);
    toast.loading("Finding cheapest chain...");
    try {
      const best = await getCheapestChain();
      if (!best) return toast.error("Failed to get cheapest chain");
      setCheapest(best);
      toast.dismiss();
      toast.success(
        `Cheapest: ${best.chain.name}, Fee: ${ethers.utils.formatEther(
          best.estimatedCost.toString()
        )} ${best.chain.nativeSymbol}`
      );
    } finally {
      setBusy(false);
    }
  };

  const switchToChain = async (chainHex: string) => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
      return true;
    } catch (err: unknown) {
      if (typeof err === "object" && err && "code" in err) {
        if ((err as { code: number }).code === 4902) {
          toast.error("Chain not found in wallet. Add it manually.");
        }
      }
      console.error(err);
      return false;
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return toast.error("Connect wallet first");
    if (!cheapest) return toast.error("Click 'Magic' first");
    if (!amount || Number(amount) <= 0) return toast.error("Enter valid amount");

    setBusy(true);
    toast.loading("Processing donation...");
    try {
      const ok = await switchToChain(cheapest.chain.chainIdHex);
      if (!ok) return setBusy(false);

      if (!window.ethereum) return toast.error("MetaMask not found!");
      const provider = new ethers.providers.Web3Provider(window.ethereum as unknown as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: "0x000000000000000000000000000000000000dead",
        value: ethers.utils.parseEther(amount),
      });
      toast.dismiss();
      toast.success(
        `Donation sent on ${cheapest.chain.name}! TxHash: ${tx.hash}`
      );
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Transaction failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-white">
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="text-lg font-semibold text-gray-800">
              Intent Donation Anoma
            </span>
          </div>
          <span className="text-sm text-gray-500">Secure And Simple.</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-10 min-h-screen">
        <div className="w-full max-w-sm bg-white border border-gray-200 shadow-xl rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Donation Form
          </h2>

          <button
            onClick={connectWallet}
            className="mb-4 w-full h-12 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium text-base transition-all duration-200"
          >
            {wallet
              ? `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}`
              : "Connect Wallet"}
          </button>

          <button
            onClick={findCheapest}
            disabled={busy}
            className="mb-4 w-full h-12 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✨ Magic
          </button>

          {cheapest && (
            <div className="mb-4 p-3 border border-gray-100 rounded-md bg-gray-50 text-sm text-gray-700">
              <p>
                <strong>Cheapest:</strong> {cheapest.chain.name}
              </p>
              <p>
                <strong>Fee:</strong>{" "}
                {ethers.utils.formatEther(cheapest.estimatedCost.toString())}{" "}
                {cheapest.chain.nativeSymbol}
              </p>
            </div>
          )}

          <form onSubmit={handleDonate} className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />

            <input
              type="number"
              placeholder={`Amount (${
                cheapest ? cheapest.chain.nativeSymbol : "XAI"
              })`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Processing..." : "Donate"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
