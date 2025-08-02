"use client"

import { useConnect, useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, Download } from "lucide-react"

export function WalletModal() {
  const { connect, connectors, isPending, error } = useConnect()
  const { isConnecting } = useAccount()

  const handleConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window !== "undefined" && !window.ethereum) {
        window.open("https://metamask.io/download/", "_blank")
        return
      }

      const connector = connectors[0]
      if (connector) {
        await connect({ connector })
      }
    } catch (err) {
      console.log("Connection failed:", err)
    }
  }

  const isMetaMaskInstalled = typeof window !== "undefined" && window.ethereum

  return (
    <Card className="w-full max-w-md bg-gray-900/95 neon-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Connect Wallet
        </CardTitle>
        <p className="text-center text-sm text-gray-400">Connect MetaMask to start using Nex Verse</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-400">
              <p className="font-medium">Connection Error</p>
              <p className="text-xs mt-1 text-red-300">Please make sure MetaMask is installed and unlocked.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isMetaMaskInstalled ? (
            <Button
              onClick={handleConnect}
              disabled={isPending || isConnecting}
              className="w-full justify-start space-x-3 h-16 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50 text-white disabled:opacity-50"
              variant="outline"
            >
              <Wallet className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-medium">MetaMask</div>
                <div className="text-xs text-gray-400">Connect using MetaMask browser extension</div>
              </div>
              {(isPending || isConnecting) && (
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              className="w-full justify-start space-x-3 h-16 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-medium">Install MetaMask</div>
                <div className="text-xs text-orange-200">Download MetaMask browser extension</div>
              </div>
            </Button>
          )}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <div className="space-y-2 text-xs text-gray-500">
            <p className="text-center">By connecting a wallet, you agree to our Terms of Service and Privacy Policy</p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <p className="text-blue-400 font-medium">💡 Getting Started:</p>
              <ol className="text-blue-300 mt-1 space-y-1">
                <li>1. Install MetaMask browser extension</li>
                <li>2. Create or import your wallet</li>
                <li>3. Click "Connect MetaMask" above</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
