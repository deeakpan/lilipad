'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  FaBars, FaTimes, FaHome, FaPlusCircle, FaInfoCircle, 
  FaLayerGroup, FaUser, FaSearch, FaWallet, FaChartBar, 
  FaFire, FaShoppingBag, FaGem, FaHistory, FaBullhorn,
  FaHeart, FaAward, FaStar, FaBookmark, FaGift, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const collections = [
  { id: 1, name: "Frogs United", image_url: "/globe.svg", items: 120, minters: 45, floor_price: 2.5, volume: 1200 },
  { id: 2, name: "Lily Legends", image_url: "/window.svg", items: 80, minters: 30, floor_price: 1.2, volume: 800 },
  { id: 3, name: "Pad Masters", image_url: "/lily-removebg-preview.png", items: 200, minters: 60, floor_price: 3.1, volume: 2500 },
  { id: 4, name: "Springfield", image_url: "/photo_2025-07-06_19-24-17.jpg", items: 99, minters: 40, floor_price: 4.2, volume: 1500 },
  { id: 5, name: "Meta Frogs", image_url: "/vercel.svg", items: 150, minters: 55, floor_price: 2.9, volume: 1800 },
  { id: 6, name: "Aqua Pads", image_url: "/next.svg", items: 110, minters: 38, floor_price: 1.7, volume: 950 },
];

// Dummy drops data (copy of collections for now)
const drops = [
  { id: 101, name: "Genesis Drop", image_url: "/globe.svg", floor_price: 2.1, items: 1000, mint_start: "2025-07-10" },
  { id: 102, name: "Rare Mint", image_url: "/window.svg", floor_price: 1.8, items: 800, mint_start: "2025-07-12" },
  { id: 103, name: "Pad Drop", image_url: "/lily-removebg-preview.png", floor_price: 2.7, items: 1200, mint_start: "2025-07-15" },
  { id: 104, name: "Springfield Drop", image_url: "/photo_2025-07-06_19-24-17.jpg", floor_price: 3.9, items: 900, mint_start: "2025-07-18" },
  { id: 105, name: "Meta Drop", image_url: "/vercel.svg", floor_price: 2.3, items: 1100, mint_start: "2025-07-20" },
  { id: 106, name: "Aqua Drop", image_url: "/next.svg", floor_price: 1.5, items: 950, mint_start: "2025-07-22" },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handlePrev = () => setSlideIndex((prev) => (prev === 0 ? collections.length - 1 : prev - 1));
  const handleNext = () => setSlideIndex((prev) => (prev === collections.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev === collections.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [collections.length]);

  // Dummy Connect Button (UI only)
  const DummyConnectButton = () => (
    <button
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black border-2 border-black rounded-md font-bold hover:bg-green-400"
    >
      <FaWallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  );

  // Mobile version of dummy connect button
  const DummyMobileConnectButton = () => (
    <button
      className="flex items-center gap-1 px-3 py-1 bg-green-500 text-black border-2 border-black rounded-md font-bold hover:bg-green-400"
      style={{ WebkitAppearance: 'none' }}
    >
      <FaWallet className="w-4 h-4" />
      <span className="text-sm">Connect</span>
    </button>
  );

  // Sidebar animation variants
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" }
  };
  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  // Navigation categories (UI only)
  const navigationCategories = {
    explore: [
      { name: "Collections", icon: <FaLayerGroup className="w-5 h-5" />, active: true },
      { name: "Stats", icon: <FaChartBar className="w-5 h-5" />, active: false },
      { name: "Drops", icon: <FaGift className="w-5 h-5" />, active: false },
      { name: "Marketplace", icon: <FaShoppingBag className="w-5 h-5" />, active: false },
      { name: "Rankings", icon: <FaAward className="w-5 h-5" />, active: false },
    ],
    create: [
      { name: "Launchpad", icon: <FaPlusCircle className="w-5 h-5" />, active: true },
      { name: "Create NFT", icon: <FaPlusCircle className="w-5 h-5" />, active: false },
      { name: "My Collections", icon: <FaLayerGroup className="w-5 h-5" />, active: false },
    ],
    account: [
      { name: "Profile", icon: <FaUser className="w-5 h-5" />, active: false },
      { name: "Favorites", icon: <FaHeart className="w-5 h-5" />, active: false },
      { name: "Transaction History", icon: <FaHistory className="w-5 h-5" />, active: false },
      { name: "Watchlist", icon: <FaBookmark className="w-5 h-5" />, active: false },
    ],
    other: [
      { name: "About", icon: <FaInfoCircle className="w-5 h-5" />, active: true },
      { name: "News", icon: <FaBullhorn className="w-5 h-5" />, active: false },
    ]
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: '#000', color: '#32CD32', borderColor: '#32CD32' }}>
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        searchVisible={searchVisible}
        setSearchVisible={setSearchVisible}
      />
      {/* Sidebar */}
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 h-screen border-r-2 border-black bg-black lg:hidden shadow-xl"
          >
            <Sidebar mobile={true} />
          </motion.aside>
        )}
        {sidebarOpen && (
          <motion.div
            key="mobile-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      {/* Desktop Sidebar */}
      <Sidebar mobile={false} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={`flex-1 overflow-y-auto pt-16 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} style={{ height: '100vh', overflowX: 'hidden' }}>
        <div className="w-full max-w-[1200px] mx-auto">
          <div 
            className={`py-6 transition-all duration-300 ${sidebarOpen ? 'opacity-50 pointer-events-none' : 'opacity-100'} lg:px-4`}
          >
            {/* Drops Slideshow */}
            <div className="w-full mb-8 relative flex flex-col items-start px-4 lg:px-0">
              <h2 className="text-xl font-bold" style={{ color: '#32CD32' }}>Drops</h2>
              <p className="text-white text-sm mb-4">Latest NFT drops and releases.</p>
              {/* Drop Image Section */}
              <div className="relative w-full overflow-hidden group drop-image-section" style={{ height: '400px', maxWidth: '100%' }}>
                <Image
                  src={drops[slideIndex % drops.length].image_url}
                  alt={drops[slideIndex % drops.length].name}
                  fill
                  style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                  className="w-full h-full object-cover lg:rounded-lg rounded-none"
                />
                {/* Drop name above overlay - always white */}
                <div className="absolute left-4 bottom-28 z-20 hidden lg:block">
                  <h3 className="text-2xl font-extrabold text-white drop-shadow-lg tracking-wider">{drops[slideIndex % drops.length].name}</h3>
                </div>
                {/* Overlay: desktop only */}
                <div className="absolute bottom-4 left-4 z-20 bg-black/80 rounded-lg px-6 py-4 flex flex-row items-center gap-10 min-w-[320px] max-w-[95vw] border-0 hidden lg:flex">
                  {/* Mint Price */}
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest mb-1">MINT PRICE</span>
                    <span className="text-lg font-mono font-bold text-white">{drops[slideIndex % drops.length].floor_price} PEPU</span>
                  </div>
                  {/* Total Items */}
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest mb-1">TOTAL ITEMS</span>
                    <span className="text-lg font-mono font-bold text-white">{drops[slideIndex % drops.length].items}</span>
                  </div>
                  {/* Mint Starts In */}
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest mb-1">MINT STARTS IN</span>
                    <span className="text-lg font-mono font-bold text-white">01:01:31:25</span>
                  </div>
                </div>
                {/* Back button */}
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-[#32CD32] rounded-full p-3 z-30 border-2 border-[#32CD32] opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#32CD32] hover:text-black hidden lg:block"
                  aria-label="Previous Drop"
                >
                  <FaChevronLeft className="w-7 h-7" />
                </button>
                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-[#32CD32] rounded-full p-3 z-30 border-2 border-[#32CD32] opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#32CD32] hover:text-black hidden lg:block"
                  aria-label="Next Drop"
                >
                  <FaChevronRight className="w-7 h-7" />
                </button>
              </div>
              {/* Mobile drop name and details below image */}
              <div className="block lg:hidden w-full mt-4">
                <div className="bg-black/80 rounded-lg px-4 py-4 flex flex-col gap-4 w-full" style={{ border: '2px solid #32CD32' }}>
                  <h3 className="text-2xl font-extrabold text-white mb-2">{drops[slideIndex % drops.length].name}</h3>
                  <div className="flex flex-row items-center gap-6 w-full">
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest mb-1">MINT PRICE</span>
                      <span className="text-lg font-mono font-bold text-white">{drops[slideIndex % drops.length].floor_price} PEPU</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest mb-1">TOTAL ITEMS</span>
                      <span className="text-lg font-mono font-bold text-white">{drops[slideIndex % drops.length].items}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest mb-1">MINT STARTS IN</span>
                      <span className="text-lg font-mono font-bold text-white">01:01:31:25</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Featured Collections Horizontal Scroll */}
            <div className="w-full mb-8 px-4 lg:px-0">
              <h2 className="text-xl font-bold" style={{ color: '#32CD32' }}>Featured Collections</h2>
              <p className="text-white text-sm mb-4">Top curated collections for this week.</p>
              <motion.div
                className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory w-full min-w-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {collections.map((col) => (
                  <motion.div
                    key={col.id}
                    className="relative rounded-lg border-2 flex-shrink-0 w-[270px] h-[170px] snap-start" style={{ borderColor: '#32CD32', background: '#000' }}
                    whileHover={{ scale: 1.04, boxShadow: '0 4px 24px #32CD32' }}
                  >
                    <Image
                      src={col.image_url}
                      alt={col.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="w-full h-full object-cover border-none"
                    />
                    {/* Overlayed text */}
                    <div className="absolute left-0 bottom-0 w-full flex flex-col items-start p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                      <div className="flex items-center gap-1 mb-1 flex-wrap w-full">
                        <span className="text-white text-[17px] font-bold drop-shadow-md whitespace-normal break-words leading-tight w-auto">{col.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap w-full">
                        <span className="text-white text-[15px] font-semibold">Floor price: <span className="text-white font-bold">{col.floor_price}</span> PEPU</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            {/* Tabs above collections */}
            <div className="flex gap-2 mb-4 h-9 items-center">
              <button className="px-2 py-1 text-sm rounded-t-lg bg-green-500 text-black font-bold border-2 border-black">Newest</button>
              <button className="px-2 py-1 text-sm rounded-t-lg bg-white text-black font-bold border-2 border-black">Trending</button>
              <button className="px-2 py-1 text-sm rounded-t-lg bg-white text-black font-bold border-2 border-black">Mints</button>
            </div>
            {/* Collections container */}
            <div className="shadow-lg border-2 w-full lg:max-w-4xl lg:ml-0 lg:px-6 lg:rounded-lg" style={{ backgroundColor: '#000', borderColor: '#32CD32' }}>
              {/* Title Container */}
              <div className="pt-6 pb-4 border-b-2 rounded-t-lg px-4 lg:px-6" style={{ backgroundColor: '#000', borderColor: '#32CD32' }}>
                <h2 className="text-2xl font-bold" style={{ color: '#32CD32' }}>Collections</h2>
              </div>
              {/* Card List Container */}
              <div className="flex flex-col gap-4 py-6 rounded-b-lg items-start px-2 sm:px-4 md:px-6 lg:px-6" style={{ backgroundColor: '#000' }}>
                {(showAllCollections ? collections : collections.slice(0, 5)).map((collection) => (
                  <div key={collection.id} className="flex items-center py-4 w-full">
                    <div className="w-20 h-20 relative flex-shrink-0 mr-6">
                      <Image 
                        src={collection.image_url || "/placeholder.jpg"} 
                        alt={collection.name} 
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg border border-black"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-white mb-1">{collection.name}</h3>
                      <span className="text-sm text-green-300 font-semibold">Floor: {collection.floor_price} PEPU</span>
                    </div>
                    <div className="flex-1 flex justify-end">
                      <button className="px-4 py-2 bg-green-500 text-black border-2 border-black rounded-md font-bold hover:bg-yellow-400 transition-colors text-sm">
                        View
                      </button>
                    </div>
                  </div>
                ))}
                {collections.length > 5 && !showAllCollections && (
                  <span
                    className="mt-2 cursor-pointer text-[#32CD32] font-semibold hover:underline text-center w-full block"
                    onClick={() => setShowAllCollections(true)}
                  >
                    See more
                  </span>
                )}
                {collections.length > 5 && showAllCollections && (
                  <span
                    className="mt-2 cursor-pointer text-[#32CD32] font-semibold hover:underline text-center w-full block"
                    onClick={() => setShowAllCollections(false)}
                  >
                    See less
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
