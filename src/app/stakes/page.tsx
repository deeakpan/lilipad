"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { ConnectButton as ConnectButtonBase } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import stakingABI from "../../abi/LiliPadStaking.json";
import { FaWallet, FaAward, FaLeaf, FaShieldAlt, FaBars, FaHistory, FaClock } from "react-icons/fa";

const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS || "0x7F992b701376851554f9a01Cc6096f2cCC0c2A95";
const LILI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LILI_TOKEN_ADDRESS || "0xaFD224042abbd3c51B82C9f43B681014c12649ca";

const TIER_INFO = [
  {
    name: "Sprout",
    icon: <FaLeaf className="text-green-400" size={28} />,
    amount: 20000,
    days: 0.0035, // 5 minutes for test
    label: "Entry level (5 min lock for test) - 33.33% discount",
    tier: 1,
    discount: "33.33%",
  },
  {
    name: "Hopper",
    icon: <FaAward className="text-green-400" size={28} />,
    amount: 30000,
    days: 50,
    label: "Mid-tier (50 days lock) - 40% discount",
    tier: 2,
    discount: "40%",
  },
  {
    name: "Guardian",
    icon: <FaShieldAlt className="text-green-400" size={28} />,
    amount: 50000,
    days: 60,
    label: "Top-tier (60 days lock) - 60% discount",
    tier: 3,
    discount: "60%",
  },
];

function formatTimeLeft(unlockTime: number) {
  const now = Math.floor(Date.now() / 1000);
  const diff = unlockTime - now;
  if (diff <= 0) return "Unlocked";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString() + ' ' + new Date(timestamp * 1000).toLocaleTimeString();
}

export default function StakesPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [activeStakes, setActiveStakes] = useState<any[]>([]);
  const [stakeHistory, setStakeHistory] = useState<any[]>([]);
  const [highestTier, setHighestTier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<'stake' | 'active' | 'history'>('stake');

  useEffect(() => { setMounted(true); }, []);

  // Fetch stake info
  useEffect(() => {
    if (!isConnected || !address) return;
    setLoading(true);
    setError("");
    async function fetchStakes() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(STAKING_ADDRESS, stakingABI.abi, provider);
        
        // Get active stakes
        const activeStakesData = await contract.getActiveStakes(address);
        const formattedActiveStakes = activeStakesData.map((stake: any) => ({
          amount: Number(ethers.formatUnits(stake.amount, 18)),
          unlockTime: Number(stake.unlockTime),
          tier: Number(stake.tier),
          active: stake.active,
          stakeTime: Number(stake.stakeTime),
        }));
        setActiveStakes(formattedActiveStakes);

        // Get highest tier
        const [tier, unlockTime] = await contract.getHighestActiveTier(address);
        if (Number(tier) > 0) {
          setHighestTier({
            tier: Number(tier),
            unlockTime: Number(unlockTime),
            name: TIER_INFO[Number(tier) - 1]?.name || 'Unknown'
          });
        } else {
          setHighestTier(null);
        }

        // Get stake history
        const historyData = await contract.getStakeHistory(address);
        const formattedHistory = historyData.map((stake: any) => ({
          amount: Number(ethers.formatUnits(stake.amount, 18)),
          unlockTime: Number(stake.unlockTime),
          tier: Number(stake.tier),
          stakeTime: Number(stake.stakeTime),
          unstakeTime: Number(stake.unstakeTime),
          wasActive: stake.wasActive,
        }));
        setStakeHistory(formattedHistory);

      } catch (e: any) {
        setActiveStakes([]);
        setStakeHistory([]);
        setHighestTier(null);
      }
      setLoading(false);
    }
    fetchStakes();
  }, [isConnected, address, txPending, refresh]);

  // Stake handler
  async function handleStake(tier: number) {
    setError("");
    setSuccess("");
    setTxPending(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, stakingABI.abi, signer);
      const tierInfo = TIER_INFO[tier - 1];
      
      // Approve first
      const liliToken = new ethers.Contract(LILI_TOKEN_ADDRESS, [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ], signer);
      
      const allowance = await liliToken.allowance(address, STAKING_ADDRESS);
      const requiredAmount = ethers.parseUnits(tierInfo.amount.toString(), 18);
      
      if (allowance < requiredAmount) {
        const approveTx = await liliToken.approve(STAKING_ADDRESS, requiredAmount);
        await approveTx.wait();
      }
      
      // Stake
      const stakeTx = await contract.stake(tier);
      await stakeTx.wait();
      
      setSuccess(`Successfully staked ${tierInfo.amount.toLocaleString()} LILI for ${tierInfo.name} tier!`);
      setRefresh(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || "Staking failed");
    }
    setTxPending(false);
  }

  // Unstake handler
  async function handleUnstake(tier: number) {
    setError("");
    setSuccess("");
    setTxPending(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, stakingABI.abi, signer);
      
      const unstakeTx = await contract.unstake(tier);
      await unstakeTx.wait();
      
      const tierInfo = TIER_INFO[tier - 1];
      setSuccess(`Successfully unstaked ${tierInfo.amount.toLocaleString()} LILI from ${tierInfo.name} tier!`);
      setRefresh(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || "Unstaking failed");
    }
    setTxPending(false);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex bg-black text-white relative" style={{ background: "linear-gradient(135deg, #101c10 0%, #000 100%)" }}>
      {/* Sidebar for desktop, slide-in for mobile */}
      <div className={`hidden lg:block`}><Sidebar /></div>
      {/* Mobile sidebar and overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" />
        </div>
      )}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden w-[70vw] max-w-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'rgba(0,0,0,0.97)' }}>
        <Sidebar mobile collapsed={false} setCollapsed={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: '#000', color: '#32CD32', borderColor: '#32CD32' }}>
        {/* Header */}
        <div className="w-full p-4 shadow-lg z-40 border-b-2 flex items-center justify-between sticky top-0 bg-black" style={{ borderColor: '#32CD32' }}>
          <div className="flex items-center gap-2">
            {/* Hamburger for mobile */}
            <button className="lg:hidden mr-2 text-white" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <FaBars size={22} />
            </button>
            <img src="/lily-removebg-preview.png" alt="LiliPad Logo" className="rounded-full object-cover w-9 h-9" />
            <h1 className="text-lg font-bold tracking-wide text-yellow-300">LiliPad</h1>
          </div>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-2 sm:px-4 md:px-8 py-8 lg:ml-64" style={{ background: "linear-gradient(135deg, #101c10 0%, #000 100%)" }}>
          <h2 className="text-3xl font-extrabold mb-2 text-[#32CD32] tracking-tight">LiliPad Staking</h2>
          <div className="mb-6 w-full max-w-3xl flex flex-col gap-2 text-center">
            <p className="text-green-200 text-sm sm:text-base font-medium leading-snug">Stake your LILI tokens to unlock exclusive benefits and discounts.</p>
            <p className="text-green-100 text-xs sm:text-sm leading-snug mt-1">Choose a tier and stake your LILI tokens to access launch fee discounts and custom minting options.</p>
            <span className="block text-yellow-300 font-semibold text-xs mt-1">Note: You will be asked to approve LILI for staking before the transaction.</span>
          </div>

          {/* Tabs */}
          <div className="w-full max-w-2xl mb-6 flex justify-center gap-2">
            <button onClick={() => setTab('stake')} className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${tab === 'stake' ? 'bg-[#181818] text-[#32CD32] border-b-2 border-yellow-400' : 'bg-[#222] text-gray-300'}`}>Stake</button>
            <button onClick={() => setTab('active')} className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${tab === 'active' ? 'bg-[#181818] text-[#32CD32] border-b-2 border-yellow-400' : 'bg-[#222] text-gray-300'}`}>Active Stakes</button>
            <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${tab === 'history' ? 'bg-[#181818] text-[#32CD32] border-b-2 border-yellow-400' : 'bg-[#222] text-gray-300'}`}>History</button>
          </div>

          {!isConnected ? (
            <div className="w-full max-w-lg bg-[#181818] border-2 border-[#32CD32] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-yellow-300 mb-4">Connect your wallet to stake LILI</span>
              <ConnectButtonBase />
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              {/* Stake Tab */}
              {tab === 'stake' && (
                <div className="w-full bg-[#181818] border-2 border-[#222] rounded-2xl shadow-xl p-4">
                  <h3 className="text-lg font-bold mb-4 text-[#32CD32]">Available Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TIER_INFO.map((tier, index) => {
                      const isStaked = activeStakes.some(stake => stake.tier === tier.tier);
                      return (
                        <div key={index} className="bg-[#222] border border-[#32CD32] rounded-xl p-3 hover:border-yellow-400 transition-all hover:scale-105 shadow">
                          <div className="text-center mb-2">
                            <div className="scale-90 mx-auto">{tier.icon}</div>
                            <h4 className="text-base font-bold mt-2 text-[#32CD32]">{tier.name}</h4>
                            <p className="text-xs text-green-200 mt-1">{tier.label}</p>
                          </div>
                          <div className="space-y-1 mb-2">
                            <div className="flex justify-between">
                              <span className="text-green-200 text-xs">Amount:</span>
                              <span className="font-bold text-[#32CD32] text-xs">{tier.amount.toLocaleString()} LILI</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-200 text-xs">Lock Period:</span>
                              <span className="font-bold text-[#32CD32] text-xs">{tier.days} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-200 text-xs">Discount:</span>
                              <span className="font-bold text-yellow-400 text-xs">{tier.discount}</span>
                            </div>
                          </div>
                          {isStaked ? (
                            <div className="text-center">
                              <span className="text-green-400 font-bold text-xs">✓ Already Staked</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStake(tier.tier)}
                              disabled={txPending}
                              className="w-full bg-[#32CD32] hover:bg-yellow-400 hover:text-black text-black py-2 px-3 rounded-full font-bold disabled:opacity-50 transition-all border border-[#32CD32] hover:border-yellow-400 text-xs"
                            >
                              {txPending ? "Processing..." : `Stake ${tier.amount.toLocaleString()} LILI`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Stakes Tab */}
              {tab === 'active' && (
                <div className="w-full bg-[#181818] border-2 border-[#222] rounded-2xl shadow-xl p-4">
                  <h3 className="text-lg font-bold mb-4 text-[#32CD32]">Active Stakes</h3>
                  {activeStakes.length === 0 ? (
                    <p className="text-gray-400 text-center">No active stakes.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeStakes.map((stake, index) => {
                        const tierInfo = TIER_INFO[stake.tier - 1];
                        return (
                          <div key={index} className="bg-[#222] border border-[#32CD32] rounded-xl p-3 flex items-center justify-between hover:border-yellow-400 transition-colors text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="scale-75">{tierInfo?.icon}</div>
                              <div>
                                <p className="font-bold text-[#32CD32] text-sm">{tierInfo?.name}</p>
                                <p className="text-green-200 text-xs">{stake.amount.toLocaleString()} LILI</p>
                                <p className="text-xs text-gray-400">Staked: {formatDate(stake.stakeTime)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-green-200 font-semibold text-xs">Unlocks in</p>
                              <p className="text-xs font-bold text-[#32CD32]">{formatTimeLeft(stake.unlockTime)}</p>
                              {formatTimeLeft(stake.unlockTime) === "Unlocked" && (
                                <button
                                  onClick={() => handleUnstake(stake.tier)}
                                  disabled={txPending}
                                  className="mt-1 bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1 rounded-full font-bold disabled:opacity-50 transition-colors text-xs"
                                >
                                  {txPending ? "Processing..." : "Unstake"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {tab === 'history' && (
                <div className="w-full bg-[#181818] border-2 border-[#222] rounded-2xl shadow-xl p-4">
                  <h3 className="text-lg font-bold mb-4 text-[#32CD32]">Stake History</h3>
                  {stakeHistory.length === 0 ? (
                    <p className="text-gray-400 text-center">No stake history yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {stakeHistory.slice().reverse().map((stake, index) => {
                        const tierInfo = TIER_INFO[stake.tier - 1];
                        return (
                          <div key={index} className="bg-[#222] border border-[#32CD32] rounded-xl p-3 flex items-center justify-between text-xs hover:border-yellow-400 transition-colors">
                            <div className="flex items-center space-x-2">
                              <div className="scale-75">{tierInfo?.icon}</div>
                              <div>
                                <p className="font-bold text-[#32CD32] text-sm">{tierInfo?.name}</p>
                                <p className="text-green-200 text-xs">{stake.amount.toLocaleString()} LILI</p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              <p>Staked: {formatDate(stake.stakeTime)}</p>
                              <p>Unstaked: {formatDate(stake.unstakeTime)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="w-full bg-red-900 border-2 border-red-700 text-red-200 px-6 py-4 rounded-2xl text-center font-bold mt-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="w-full bg-green-900 border-2 border-green-700 text-green-200 px-6 py-4 rounded-2xl text-center font-bold mt-4">
                  {success}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 