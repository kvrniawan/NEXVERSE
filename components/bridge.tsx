"use client";

import { ethers } from "ethers";
import { useState, useEffect, useMemo } from "react";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeftRight,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

// Bridge Smart Contract Configuration
const BRIDGE_CONTRACT_ABI = [
  {
    inputs: [],
    name: "swap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "SwapInitiated",
    type: "event",
  },
] as const;

// TODO: Replace with your actual deployed contract address
const BRIDGE_CONTRACT_ADDRESS = "0xF6c99F60B94a2a294DC902aeaabA67007573A4e4"; // <-- INPUT YOUR CONTRACT ADDRESS HERE
const SEPOLIA_CHAIN_ID = 11155111;
const NEXUS_CHAIN_ID = 3940;

export function Bridge() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const {
    writeContract,
    data: hash,
    error: contractError,
    isPending: isContractPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const isOnSepolia = chain?.id === 11155111;
  const estimatedGas = "0.002";
  // New reward system: 100 points minimum, up to 500 points max
  const bridgeReward = useMemo(() => {
    const amountNum = Number.parseFloat(amount || "0");
    if (amountNum <= 0) return 0;
    if (amountNum <= 1) return 100; // 0.0001 - 1 ETH = 100 points

    // More than 1 ETH: 100 + (extra amount * 100), max 500
    const extraAmount = amountNum - 1;
    const extraPoints = Math.floor(extraAmount * 100);
    return Math.min(100 + extraPoints, 500); // Maximum 500 points
  }, [amount]); // 100 points per token

  const handleBridge = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!isOnSepolia) {
      setError("Please switch to Sepolia network first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const amountInWei = ethers.parseEther(amount); // Gunakan parseEther langsung

      await writeContract({
        address: BRIDGE_CONTRACT_ADDRESS as `0x${string}`,
        abi: BRIDGE_CONTRACT_ABI,
        functionName: "swap",
        value: amountInWei,
      });
    } catch (err: any) {
      console.error("Swap transaction failed:", err);
      setError(err.message || "Swap transaction failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle successful swap transaction
  useEffect(() => {
    if (isConfirmed && hash && address) {
      // Add swap activity to dashboard
      const swapPoints = Math.floor(Number.parseFloat(amount || "0") * 100);

      // Add to activities (you'll need to import this function from dashboard)
      const newActivity = {
        type: "swap" as const,
        action: `Swapped ${amount} ETH to Nexus`,
        points: swapPoints,
        time: "Just now",
        timestamp: Date.now(),
      };

      const activitiesKey = `activities_${address}`;
      const savedActivities = localStorage.getItem(activitiesKey);
      const activities = savedActivities ? JSON.parse(savedActivities) : [];
      activities.push(newActivity);
      localStorage.setItem(activitiesKey, JSON.stringify(activities));

      // Set success state
      setTxHash(hash);
      setAmount("");
      setIsLoading(false);
    }
  }, [isConfirmed, hash, amount, address]);

  // Handle transaction errors
  useEffect(() => {
    if (contractError) {
      setError(contractError.message || "Swap transaction failed");
      setIsLoading(false);
    }
  }, [contractError]);

  const handleSwitchToSepolia = () => {
    switchChain({ chainId: 11155111 });
  };

  const isProcessing = isLoading || isContractPending || isConfirming;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Swap Header */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-400" />
            <span>Cross-Chain Swap</span>
          </CardTitle>
          <p className="text-sm text-gray-400">
            Swap tokens from Ethereum Sepolia to Nexus Testnet and earn NEX
            reward points
          </p>
        </CardHeader>
      </Card>

      {/* Network Status */}
      <Card className="bg-gray-900/50 neon-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <Badge
                  variant={isOnSepolia ? "default" : "secondary"}
                  className="mb-2"
                >
                  Ethereum Sepolia
                </Badge>
                <p className="text-sm text-gray-400">From</p>
              </div>
              <ArrowRight className="w-6 h-6 text-purple-400" />
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="mb-2 border-purple-500 text-purple-400"
                >
                  Nexus Testnet
                </Badge>
                <p className="text-sm text-gray-400">To</p>
              </div>
            </div>

            {!isOnSepolia && (
              <Button
                onClick={handleSwitchToSepolia}
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              >
                Switch to Sepolia
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Swap Form */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="text-lg">Amount to swap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Amount to Bridge
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pr-20"
                disabled={!isOnSepolia}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                {balance?.symbol || "ETH"}
              </div>
            </div>
            {balance && (
              <p className="text-xs text-gray-500">
                Balance: {Number.parseFloat(balance.formatted).toFixed(6)}{" "}
                {balance.symbol}
              </p>
            )}
          </div>

          {/* Swap Details */}
          {amount && Number.parseFloat(amount) > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Gas Fee:</span>
                <span className="text-white">{estimatedGas} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Swap Reward:</span>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-medium">
                    +{bridgeReward} Points
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-400">You will receive:</span>
                <span className="text-green-400 font-medium">{amount} NEX</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {txHash && (
            <div className="space-y-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">
                  Swap Successful!
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Transaction Hash:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <span>
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">
                  +{bridgeReward} Points earned!
                </span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleBridge}
            disabled={
              !isOnSepolia ||
              !amount ||
              Number.parseFloat(amount) <= 0 ||
              isProcessing
            }
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 neon-glow"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Bridging...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Swap Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Swap Info */}
      <Card className="bg-gray-900/50 neon-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-400">
              How Swap Rewards Work
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <span>Swap 0.0001 - 1 ETH: Get 100 points</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <span>Swap more than 1 ETH: Get extra 100 points per ETH</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <span>Maximum reward: 500 points per swap</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <span>Points are automatically credited to your account</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <span>Swap transactions are recorded on-chain</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
