'use client';

import { WagmiProvider, http } from 'wagmi';
import { createConfig } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const pepuTestnet = {
  id: 97740,
  name: 'PEPU Testnet',
  nativeCurrency: {
    name: 'PEPU',
    symbol: 'PEPU',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz'],
    },
    public: {
      http: ['https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PEPU Explorer',
      url: 'https://explorer-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz',
    },
  },
} as const;

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set in your environment variables.');
}

const config = getDefaultConfig({
  appName: 'LiliPad',
  projectId,
  chains: [pepuTestnet],
  transports: {
    [pepuTestnet.id]: http(),
  },
});

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 