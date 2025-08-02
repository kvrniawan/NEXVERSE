"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Dashboard } from "@/components/dashboard";
import { Bridge } from "@/components/bridge";
import { TapGame } from "@/components/tap-game";
import { Navigation } from "@/components/navigation";
import { Header } from "@/components/header";
import { WalletModal } from "@/components/wallet-modal";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              NEX VERSE
            </h1>
            <p className="text-xl text-gray-400">
              Connect your wallet to start earning NEX and swapping
            </p>
          </div>
          <div className="flex justify-center">
            <WalletModal />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "bridge":
        return <Bridge />;
      case "game":
        return <TapGame />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
