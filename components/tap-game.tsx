"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Trophy,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Battery,
} from "lucide-react";

// Smart contract ABI for claiming points
const GAME_CONTRACT_ABI = [
  {
    inputs: [{ name: "points", type: "uint256" }],
    name: "claimPoints",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const GAME_CONTRACT_ADDRESS = "0x27D30D158D0D87BC22f6fD49140f335e46f0cC24";
const NEXUS_CHAIN_ID = 3940;

// Energy system constants
const MAX_ENERGY = 100;
const ENERGY_REGEN_TIME = 60000; // 1 minute per energy point (in milliseconds)

export function TapGame() {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [tapPoints, setTapPoints] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [tapsRemaining, setTapsRemaining] = useState(MAX_ENERGY);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sparkles, setSparkles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const [nextEnergyRegen, setNextEnergyRegen] = useState<Date | null>(null);
  const [energyRegenCountdown, setEnergyRegenCountdown] = useState("");

  const isOnNexus = chain?.id === NEXUS_CHAIN_ID;

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (address) {
      const totalEarnedKey = `total_earned_${address}`;
      const energyKey = `energy_${address}`;
      const lastEnergyUpdateKey = `last_energy_update_${address}`;

      // Load total earned
      const savedTotalEarned = localStorage.getItem(totalEarnedKey);
      if (savedTotalEarned) {
        setTotalEarned(Number.parseInt(savedTotalEarned, 10));
      }

      // Load energy data
      const savedEnergy = localStorage.getItem(energyKey);
      const savedLastUpdate = localStorage.getItem(lastEnergyUpdateKey);

      if (savedEnergy && savedLastUpdate) {
        const currentEnergy = Number.parseInt(savedEnergy, 10);
        const lastUpdate = new Date(savedLastUpdate);
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdate.getTime();

        // Calculate how much energy should have regenerated
        const energyToRegen = Math.floor(timeDiff / ENERGY_REGEN_TIME);
        const newEnergy = Math.min(MAX_ENERGY, currentEnergy + energyToRegen);

        setTapsRemaining(newEnergy);

        // Set next regen time if not at max energy
        if (newEnergy < MAX_ENERGY) {
          const timeToNextRegen =
            ENERGY_REGEN_TIME - (timeDiff % ENERGY_REGEN_TIME);
          setNextEnergyRegen(new Date(now.getTime() + timeToNextRegen));
        }
      }
    }
  }, [address]);

  // Energy regeneration timer
  useEffect(() => {
    if (tapsRemaining < MAX_ENERGY && address) {
      const timer = setInterval(() => {
        const now = new Date();

        if (nextEnergyRegen && now >= nextEnergyRegen) {
          const newEnergy = Math.min(MAX_ENERGY, tapsRemaining + 1);
          setTapsRemaining(newEnergy);

          // Save to localStorage
          const energyKey = `energy_${address}`;
          const lastEnergyUpdateKey = `last_energy_update_${address}`;
          localStorage.setItem(energyKey, newEnergy.toString());
          localStorage.setItem(lastEnergyUpdateKey, now.toISOString());

          // Set next regen time if still not at max
          if (newEnergy < MAX_ENERGY) {
            setNextEnergyRegen(new Date(now.getTime() + ENERGY_REGEN_TIME));
          } else {
            setNextEnergyRegen(null);
          }
        }

        // Update countdown display
        if (nextEnergyRegen && tapsRemaining < MAX_ENERGY) {
          const diff = nextEnergyRegen.getTime() - now.getTime();
          if (diff > 0) {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setEnergyRegenCountdown(
              `${minutes}:${seconds.toString().padStart(2, "0")}`
            );
          }
        } else {
          setEnergyRegenCountdown("");
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setEnergyRegenCountdown("");
    }
  }, [tapsRemaining, nextEnergyRegen, address]);

  // Reset tap points when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && hash && address) {
      const newTotalEarned = totalEarned + tapPoints;
      setTotalEarned(newTotalEarned);

      // Add game activity to dashboard
      const newActivity = {
        type: "game" as const,
        action: `Claimed ${tapPoints} points from tap game`,
        points: tapPoints,
        time: "Just now",
        timestamp: Date.now(),
      };

      const activitiesKey = `activities_${address}`;
      const savedActivities = localStorage.getItem(activitiesKey);
      const activities = savedActivities ? JSON.parse(savedActivities) : [];
      activities.push(newActivity);
      localStorage.setItem(activitiesKey, JSON.stringify(activities));

      // Save total earned to localStorage
      const totalEarnedKey = `total_earned_${address}`;
      localStorage.setItem(totalEarnedKey, newTotalEarned.toString());

      // Reset tap points
      setTapPoints(0);
    }
  }, [isConfirmed, tapPoints, totalEarned, address]);

  const handleTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (tapsRemaining <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Add sparkle effect
    const newSparkle = { id: Date.now(), x, y };
    setSparkles((prev) => [...prev, newSparkle]);

    // Remove sparkle after animation
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
    }, 600);

    // Update points and energy
    setTapPoints((prev) => prev + 1);
    const newEnergy = tapsRemaining - 1;
    setTapsRemaining(newEnergy);
    setIsAnimating(true);

    setTimeout(() => setIsAnimating(false), 300);

    // Save energy state to localStorage
    if (address) {
      const energyKey = `energy_${address}`;
      const lastEnergyUpdateKey = `last_energy_update_${address}`;
      const now = new Date();

      localStorage.setItem(energyKey, newEnergy.toString());
      localStorage.setItem(lastEnergyUpdateKey, now.toISOString());

      // Start energy regeneration if this was the first tap from full energy
      if (tapsRemaining === MAX_ENERGY) {
        setNextEnergyRegen(new Date(now.getTime() + ENERGY_REGEN_TIME));
      }
    }
  };

  const handleClaimPoints = async () => {
    if (tapPoints === 0) return;

    if (!isOnNexus) {
      if (switchChain) {
        switchChain({ chainId: NEXUS_CHAIN_ID });
      }
      return;
    }

    try {
      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: GAME_CONTRACT_ABI,
        functionName: "claimPoints",
        args: [BigInt(tapPoints)],
      });
    } catch (err) {
      console.error("Failed to claim points:", err);
    }
  };

  const getEnergyColor = () => {
    const percentage = (tapsRemaining / MAX_ENERGY) * 100;
    if (percentage > 66) return "text-green-400 border-green-500";
    if (percentage > 33) return "text-yellow-400 border-yellow-500";
    return "text-red-400 border-red-500";
  };

  const getEnergyBarColor = () => {
    const percentage = (tapsRemaining / MAX_ENERGY) * 100;
    if (percentage > 66) return "from-green-500 to-blue-500";
    if (percentage > 33) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Game Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gray-900/50 neon-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {tapPoints}
              </div>
              <p className="text-sm text-gray-400">Pending Points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 neon-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {totalEarned.toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">Total Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Status */}
      {!isOnNexus && (
        <Card className="bg-orange-900/20 border-orange-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400">
                  Switch to Nexus Network to claim points
                </span>
              </div>
              <Button
                onClick={() =>
                  switchChain && switchChain({ chainId: NEXUS_CHAIN_ID })
                }
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
              >
                Switch Network
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Status */}
      {hash && (
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {isConfirming && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Confirming transaction...</span>
                </div>
              )}
              {isConfirmed && (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Points claimed successfully!</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Transaction Hash:</span>
                <a
                  href={`https://testnet3.explorer.nexus.xyz/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <span>
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">
                {error.message || "Failed to claim points. Please try again."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Energy System */}
      <Card className="bg-gray-900/50 neon-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Battery
                className={`w-5 h-5 ${getEnergyColor().split(" ")[0]}`}
              />
              <span className="text-sm text-gray-400">Energy:</span>
              <Badge variant="outline" className={getEnergyColor()}>
                {tapsRemaining}/{MAX_ENERGY}
              </Badge>
            </div>

            {energyRegenCountdown && tapsRemaining < MAX_ENERGY && (
              <div className="flex items-center space-x-2 text-sm text-blue-400">
                <Clock className="w-4 h-4" />
                <span>Next energy: {energyRegenCountdown}</span>
              </div>
            )}
          </div>

          {/* Energy Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`bg-gradient-to-r ${getEnergyBarColor()} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${(tapsRemaining / MAX_ENERGY) * 100}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            {tapsRemaining === MAX_ENERGY
              ? "Energy full! Ready to tap!"
              : `Energy regenerates 1 point every minute`}
          </div>
        </CardContent>
      </Card>

      {/* Tap Game Area */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span>Tap to Earn NEX</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-center justify-center py-12">
            {/* Tap Target */}
            <div
              onClick={handleTap}
              className={`relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isAnimating ? "tap-bounce" : ""
              } ${
                tapsRemaining > 0
                  ? "hover:scale-105 neon-glow shadow-2xl"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {/* Elephant Icon/Animation would go here */}
              <div className="text-6xl">🐘</div>

              {/* Sparkle Effects */}
              {sparkles.map((sparkle) => (
                <div
                  key={sparkle.id}
                  className="absolute w-4 h-4 text-yellow-400 sparkle pointer-events-none"
                  style={{
                    left: sparkle.x - 8,
                    top: sparkle.y - 8,
                  }}
                >
                  ✨
                </div>
              ))}
            </div>

            {/* Tap Instructions */}
            <div className="absolute bottom-0 text-center">
              <p className="text-sm text-gray-400">
                {tapsRemaining > 0
                  ? "Tap the elephant to earn points!"
                  : "No energy remaining - wait for regeneration"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claim Points */}
      <Card className="bg-gray-900/50 neon-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Ready to Claim</h3>
              <p className="text-sm text-gray-400">
                Send your earned points to the Nexus blockchain
              </p>
            </div>
            <Button
              onClick={handleClaimPoints}
              disabled={tapPoints === 0 || isPending || isConfirming}
              className={`${
                tapPoints > 0 && isOnNexus
                  ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 neon-glow"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {isPending || isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isPending ? "Claiming..." : "Confirming..."}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Claim {tapPoints} Points
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Game Rules */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Game Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
              <span>Each tap consumes 1 energy and earns 1 point</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
              <span>Energy regenerates 1 point every minute (max 100)</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
              <span>Claim points to record them on Nexus blockchain</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
              <span>Points contribute to your leaderboard ranking</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
