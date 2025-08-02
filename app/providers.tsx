"use client"

import type React from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { sepolia } from "wagmi/chains"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { injected } from "wagmi/connectors"

// Nexus Testnet configuration
const nexusTestnet = {
  id: 3940,
  name: "Nexus Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "NEX",
    symbol: "NEX",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet3.rpc.nexus.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "Nexus Explorer", url: "https://testnet3.explorer.nexus.xyz" },
  },
} as const

// Simple config with minimal dependencies
const config = createConfig({
  chains: [sepolia, nexusTestnet],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [nexusTestnet.id]: http("https://testnet3.rpc.nexus.xyz"),
  },
  ssr: true,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
