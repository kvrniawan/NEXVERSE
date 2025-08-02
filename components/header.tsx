"use client"

import { useAccount, useBalance } from "wagmi"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Wallet, Zap } from "lucide-react"

export function Header() {
  const { address, chain } = useAccount()
  const { data: balance } = useBalance({ address })

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              NEX VERSE
            </h1>
            {address && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800 neon-border">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                {balance && (
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800 neon-border">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">
                      {Number.parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}
