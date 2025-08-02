"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, Copy, Check, AlertCircle } from "lucide-react"
import { useState } from "react"

export function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.log("Copy failed:", err)
      }
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          onClick={copyAddress}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
        >
          {copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
          className="bg-red-900/20 border-red-500/30 hover:bg-red-900/30 text-red-400"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  const handleConnect = async () => {
    try {
      const connector = connectors[0]
      if (connector) {
        await connect({ connector })
      }
    } catch (err) {
      console.log("Connection failed:", err)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center space-x-2 p-2 rounded bg-red-900/20 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Connection failed. Please install MetaMask.</span>
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={isPending}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 neon-glow disabled:opacity-50"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isPending ? "Connecting..." : "Connect MetaMask"}
      </Button>
    </div>
  )
}
