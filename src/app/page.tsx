'use client';

import { useState, useEffect } from "react";
import Image from "next/image";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock data for collections
  const collections = [
    {
      id: "1",
      name: "LilyPad Warriors",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop",
      items: 1000,
      minters: 847,
      floor_price: "50",
      volume: "125,000"
    },
    {
      id: "2",
      name: "Pepe Legends",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop",
      items: 500,
      minters: 423,
      floor_price: "75",
      volume: "89,500"
    },
    {
      id: "3",
      name: "Crypto Frogs",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop",
      items: 2000,
      minters: 1567,
      floor_price: "25",
      volume: "234,000"
    },
    {
      id: "4",
      name: "Digital Dragons",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop",
      items: 750,
      minters: 634,
      floor_price: "100",
      volume: "156,750"
    },
    {
      id: "5",
      name: "Meme Masters",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop",
      items: 1500,
      minters: 1234,
      floor_price: "40",
      volume: "198,000"
    },
    {
      id: "6",
      name: "Pixel Punks",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop",
      items: 3000,
      minters: 2456,
      floor_price: "30",
      volume: "345,600"
    },
    {
      id: "7",
      name: "Anime Apes",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop",
      items: 800,
      minters: 678,
      floor_price: "60",
      volume: "112,800"
    },
    {
      id: "8",
      name: "Cyber Cats",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop",
      items: 1200,
      minters: 987,
      floor_price: "45",
      volume: "167,400"
    }
  ];

  // Mock data for featured slideshow
  const featuredItems = [
    {
      id: "f1",
      name: "Featured Collection 1",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop",
      description: "Exclusive NFT collection with unique traits and rare attributes",
      price: "100 PEPU",
      subtitle: "Limited Edition"
    },
    {
      id: "f2", 
      name: "Featured Collection 2",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1200&h=600&fit=crop",
      description: "Limited edition digital art pieces from world-renowned artists",
      price: "150 PEPU",
      subtitle: "Artist Series"
    },
    {
      id: "f3",
      name: "Featured Collection 3", 
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop",
      description: "Premium gaming NFTs with real utility and exclusive benefits",
      price: "200 PEPU",
      subtitle: "Gaming NFTs"
    }
  ];

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-play slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [featuredItems.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const handleWalletConnect = () => {
    setIsWalletConnected(!isWalletConnected);
  };

  const renderComingSoon = (tabName: string) => {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-900 rounded-lg border border-gray-700 shadow-lg p-8 w-full max-w-lg mx-auto">
        <div className="text-gray-400 text-6xl mb-4">🚧</div>
        <h2 className="text-3xl font-bold text-white mb-2">{tabName}</h2>
        <p className="text-gray-300 text-xl">Coming Soon</p>
        <div className="mt-6 bg-gray-700 text-white font-bold py-2 px-6 rounded-md border border-gray-600">
          Stay Tuned!
        </div>
      </div>
    );
  };

  const renderNoResults = () => {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-900 rounded-lg border border-gray-700 shadow-lg p-8 w-full max-w-lg mx-auto">
        <div className="text-gray-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Collection Not Found</h2>
        <p className="text-gray-300 text-lg text-center">We couldn't find any collections matching your search.</p>
        <button 
          onClick={() => setSearchQuery("")} 
          className="mt-6 bg-gray-700 text-white font-bold py-2 px-6 rounded-md border border-gray-600"
        >
          Clear Search
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 w-full bg-gray-900 p-4 shadow-lg z-40 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="text-white"
                >
                  {sidebarOpen ? "✕" : "☰"}
                </button>

                {/* LilyPad Branding */}
                <div className="text-lg font-bold text-white">
                  LilyPad
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Search Icon */}
                <button 
                  onClick={() => setSearchVisible(!searchVisible)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <button
                  onClick={handleWalletConnect}
                  className={`flex items-center gap-1 px-3 py-1 border border-gray-600 rounded font-medium text-sm ${
                    isWalletConnected 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {isWalletConnected ? 'Connected' : 'Connect'}
                </button>
              </div>
            </div>

            {/* Mobile Search Bar - Hidden by default */}
            {searchVisible && (
              <div className="mb-3">
                <input 
                  type="text" 
                  placeholder="Search collections..."
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
                />
              </div>
            )}
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* LilyPad Branding */}
              <div className="text-xl font-bold text-white">
                LilyPad
              </div>
              
              {/* Search bar on desktop */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search collections..."
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded w-80 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Items */}
              <div className="flex items-center space-x-3">
                <button className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium text-sm rounded border border-transparent hover:border-gray-600">
                  Collections
                </button>
                <button className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium text-sm rounded border border-transparent hover:border-gray-600">
                  Launchpad
                </button>
                <button className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium text-sm rounded border border-transparent hover:border-gray-600">
                  Drops
                </button>
                <button className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium text-sm rounded border border-transparent hover:border-gray-600">
                  Auction
                </button>
              </div>
              
              <button
                onClick={handleWalletConnect}
                className={`flex items-center gap-2 px-4 py-2 border border-gray-600 rounded font-medium ${
                  isWalletConnected 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {isWalletConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 border-r border-gray-800 z-50 lg:hidden transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm uppercase text-gray-400 font-bold tracking-wider mb-4">Navigation</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors font-medium">
                  Collections
                </button>
                <button className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors font-medium">
                  Launchpad
                </button>
                <button className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors font-medium">
                  Drops
                </button>
                <button className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors font-medium">
                  Auction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-black min-h-screen" style={{ paddingTop: "calc(4rem + 48px)" }}>
        <div className="w-full bg-black min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-6">
            
            {/* Featured Slideshow Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Featured Collections</h2>
              <div className="relative w-full max-w-3xl">
                {/* Main Slideshow */}
                <div className="relative w-full h-80 rounded-lg overflow-hidden border border-gray-800 shadow-lg">
                  <Image 
                    src={featuredItems[currentSlide].image_url} 
                    alt={featuredItems[currentSlide].name} 
                    fill
                    className="object-cover transition-all duration-500 ease-in-out"
                    priority
                  />
                  
                  {/* Overlay with content */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="text-xs text-blue-400 font-medium mb-2 uppercase tracking-wider">
                        {featuredItems[currentSlide].subtitle}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{featuredItems[currentSlide].name}</h3>
                      <p className="text-gray-300 mb-4 max-w-sm text-sm leading-relaxed">{featuredItems[currentSlide].description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-blue-400">{featuredItems[currentSlide].price}</span>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                          View Collection
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <button 
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Previous slide"
                  >
                    <span className="text-lg">‹</span>
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Next slide"
                  >
                    <span className="text-lg">›</span>
                  </button>
                </div>
                
                {/* Slide Indicators */}
                <div className="flex space-x-2 mt-4">
                  {featuredItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide 
                          ? 'bg-blue-500' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs Section - Left Aligned */}
            <div className="mb-6">
              <div className="flex space-x-1">
                {["Newest", "Top", "Mints"].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)} 
                    className={`px-4 py-2 rounded text-sm font-medium border transition
                      ${activeTab === tab ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === "Newest" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {filteredCollections.length > 0 ? (
                  filteredCollections.map((collection) => (
                    <div 
                      key={collection.id} 
                      className="border border-gray-800 rounded-lg bg-gray-900 shadow-lg flex flex-col transform transition duration-500 hover:shadow-xl overflow-hidden hover:scale-105"
                    >
                      <div className="w-full aspect-square relative border-b border-gray-800">
                        <Image 
                          src={collection.image_url} 
                          alt={collection.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3 lg:p-4 flex flex-col text-white">
                        <h2 className="text-base sm:text-lg font-bold truncate">{collection.name}</h2>
                        
                        {/* Desktop - Vertical layout */}
                        <div className="hidden lg:flex flex-col space-y-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-400">Items:</span>
                            <span className="text-sm">{collection.items}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-400">Minters:</span>
                            <span className="text-sm">{collection.minters}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-400">Floor:</span>
                            <span className="text-sm">{collection.floor_price} PEPU</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-400">Volume:</span>
                            <span className="text-sm">{collection.volume} PEPU</span>
                          </div>
                        </div>
                        
                        {/* Mobile - Compact layout */}
                        <div className="lg:hidden grid grid-cols-2 gap-x-6 gap-y-0.5 mt-1.5">
                          <div>
                            <span className="text-xs font-medium text-gray-400">Items:</span>
                            <span className="text-xs ml-1">{collection.items}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-400">Minters:</span>
                            <span className="text-xs ml-1">{collection.minters}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-400">Floor:</span>
                            <span className="text-xs ml-1">{collection.floor_price}</span>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-400">Volume:</span>
                            <span className="text-xs ml-1">{collection.volume}</span>
                          </div>
                        </div>
                        
                        <button className="w-full px-2.5 py-1.5 bg-gray-700 text-white border border-gray-600 rounded font-medium hover:bg-gray-600 transition-colors text-sm mt-3">
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    {renderNoResults()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center">
                {renderComingSoon(activeTab)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
