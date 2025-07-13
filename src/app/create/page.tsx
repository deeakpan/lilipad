'use client';
import { useState, useEffect } from "react";
import { FaWallet } from "react-icons/fa";
import { ConnectButton as ConnectButtonBase } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { FaLayerGroup, FaArrowUp, FaThLarge } from "react-icons/fa";
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#000', color: '#32CD32', borderColor: '#32CD32' }}>
      {/* Minimal Header */}
      <div className="w-full p-4 shadow-lg z-40 border-b-2 flex items-center justify-between" style={{ backgroundColor: '#000', borderColor: '#32CD32' }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/lily-removebg-preview.png" 
            alt="LiliPad Logo" 
            className="rounded-full object-cover w-9 h-9"
          />
          <h1 className="text-lg font-bold tracking-wide text-yellow-300">LiliPad</h1>
        </Link>
        {mounted && (
          <ConnectButtonBase.Custom>
            {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }: any) => (
              <button
                onClick={
                  !mounted
                    ? undefined
                    : !account || !chain
                    ? openConnectModal
                    : openAccountModal
                }
                type="button"
                className="flex items-center gap-2 px-3 py-1 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-sm"
              >
                <FaWallet className="w-5 h-5" />
                <span className="font-semibold text-sm">{account ? 'connected' : 'connect'}</span>
              </button>
            )}
          </ConnectButtonBase.Custom>
        )}
      </div>
      {/* Page Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8">
        {/* Top Section: Big Heading and Subtext */}
        <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-2">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#32CD32' }}>
            Launch your NFTs on <span className="text-yellow-300">LiliPad</span> on the Pepe Unchained l2
          </h2>
          <p className="text-base text-green-200">
            Start by generating and exporting your collection metadata{' '}
            <a href="https://lilipad-nft-export.vercel.app" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-400">here</a>
          </p>
        </div>
        <div className="w-full max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Create a new NFT */}
            <button className="flex flex-col items-center justify-center bg-black border-2 border-[#32CD32] rounded-2xl shadow-lg p-6 md:p-12 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] focus:outline-none group relative overflow-hidden min-h-[220px] md:min-h-[340px]" >
              <FaArrowUp className="text-[#32CD32] mb-4 md:mb-6 z-10" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
              <span className="text-2xl font-extrabold text-white mb-2 z-10">Create a new NFT</span>
              <span className="text-base text-green-200 z-10 text-center">Mint a unique NFT and add it to your collection or wallet. Quick, easy, and gas-optimized.</span>
            </button>
            {/* Card 2: Launch a collection of NFTs */}
            <button
              className="flex flex-col items-center justify-center w-full bg-black border-2 border-[#32CD32] rounded-2xl shadow-lg p-6 md:p-12 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] focus:outline-none group relative overflow-hidden min-h-[220px] md:min-h-[340px]"
              style={{ minHeight: 340 }}
              onClick={() => {
                if (isConnected) {
                  router.push('/launch');
                } else {
                  setShowModal(true);
                }
              }}
            >
              {/* No gradient overlay */}
              <FaThLarge className="text-[#32CD32] mb-4 md:mb-6 z-10" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
              <span className="text-2xl font-extrabold text-white mb-2 z-10">Launch a collection of NFTs</span>
              <span className="text-base text-green-200 z-10 text-center">Deploy and manage a full NFT collection for your project, community, or brand. Advanced options available.</span>
            </button>
            {/* Modal for connect wallet */}
            {showModal && (
              <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black border-2 border-[#32CD32] rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center">
                  <span className="text-base font-bold text-white mb-3">
                    Connect your wallet to launch a
                    <span className="block text-white text-lg text-center mx-auto">collection</span>
                  </span>
                  <ConnectButtonBase.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={() => { openConnectModal(); setShowModal(false); }}
                        className="px-4 py-2 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-base mt-2"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </ConnectButtonBase.Custom>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-3 text-[#32CD32] underline hover:text-yellow-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 