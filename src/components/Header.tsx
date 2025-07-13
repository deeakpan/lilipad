import React from "react";
import Image from "next/image";
import { FaBars, FaTimes, FaSearch, FaUser, FaWallet } from "react-icons/fa";
import { ConnectButton as ConnectButtonBase } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";

// Dummy Connect Button (UI only)
const DummyConnectButton = () => (
  <button
    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black border-2 border-black rounded-md font-bold hover:bg-green-400"
  >
    <FaUser className="w-4 h-4" />
    <span>Connect Wallet</span>
  </button>
);

const DummyMobileConnectButton = () => (
  <button
    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-black border-2 border-black rounded-md font-bold hover:bg-green-400"
    style={{ WebkitAppearance: 'none' }}
  >
    <FaUser className="w-4 h-4" />
    <span className="text-sm">Connect</span>
  </button>
);

export default function Header({
  searchQuery,
  setSearchQuery,
  sidebarOpen,
  setSidebarOpen,
  searchVisible,
  setSearchVisible,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  searchVisible: boolean;
  setSearchVisible: (v: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 w-full p-4 shadow-lg z-40 border-b-2" style={{ backgroundColor: '#000', borderColor: '#32CD32' }}>
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              id="hamburger-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white z-50"
            >
              {sidebarOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <img 
                src="/lily-removebg-preview.png" 
                alt="LiliPad Logo" 
                className="rounded-full object-cover w-9 h-9"
              />
              <h1 className="text-lg font-bold tracking-wide text-yellow-300">LiliPad</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-1/2 justify-end">
            <button onClick={() => setSearchVisible(!searchVisible)} className="text-white">
              <FaSearch className="w-5 h-5" />
            </button>
            {mounted && (
              <div className="w-full">
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
                      className="flex items-center justify-center gap-2 w-auto px-2 py-1 sm:px-5 sm:py-2 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-sm sm:text-base sm:w-auto"
                    >
                      <FaWallet className="w-5 h-5 mr-1" />
                      <span className="block sm:hidden font-semibold text-sm">
                        {account ? 'connected' : 'connect'}
                      </span>
                      <span className="hidden sm:block">{account ? account.displayName : 'Connect Wallet'}</span>
                    </button>
                  )}
                </ConnectButtonBase.Custom>
              </div>
            )}
          </div>
        </div>
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lily-removebg-preview.png" 
              alt="LiliPad Logo" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <h1 className="text-xl font-bold tracking-wide text-yellow-300">LiliPad</h1>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search collections..."
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 rounded-full w-full bg-black text-white placeholder-gray-400 focus:outline-none"
                style={{ borderColor: '#32CD32' }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
                    className="flex items-center gap-2 px-5 py-2 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors w-full sm:w-auto text-base sm:text-base text-sm"
                  >
                    <FaWallet className="w-5 h-5 mr-1" />
                    {account ? account.displayName : 'Connect Wallet'}
                  </button>
                )}
              </ConnectButtonBase.Custom>
            )}
            <span className="ml-2 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-black">
              <FaUser className="text-black w-6 h-6" />
            </span>
          </div>
        </div>
        {searchVisible && (
          <div className="lg:hidden mt-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border-2 rounded-full bg-black text-white placeholder-gray-400 focus:outline-none"
                style={{ borderColor: '#32CD32' }}
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 