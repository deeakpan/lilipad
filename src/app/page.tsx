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
      items: 100,
      minters: 47,
      floor_price: "5",
      volume: "2,450",
      change: "+12.5%"
    },
    {
      id: "2",
      name: "Pepe Legends",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop",
      items: 50,
      minters: 23,
      floor_price: "7.5",
      volume: "1,890",
      change: "+8.3%"
    },
    {
      id: "3",
      name: "Crypto Frogs",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop",
      items: 200,
      minters: 67,
      floor_price: "2.5",
      volume: "4,200",
      change: "-2.1%"
    },
    {
      id: "4",
      name: "Digital Dragons",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop",
      items: 75,
      minters: 34,
      floor_price: "10",
      volume: "3,150",
      change: "+15.7%"
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

  // Mock data for trending collections
  const trendingCollections = [
    {
      id: "t1",
      name: "Trending #1",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&h=300&fit=crop",
      floor: "3.2",
      volume: "890",
      change: "+45%"
    },
    {
      id: "t2",
      name: "Trending #2",
      image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=300&h=300&fit=crop",
      floor: "1.8",
      volume: "650",
      change: "+32%"
    },
    {
      id: "t3",
      name: "Trending #3",
      image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&h=300&fit=crop",
      floor: "5.5",
      volume: "1,200",
      change: "+28%"
    }
  ];

  // Mock data for recent activity
  const recentActivity = [
    { id: "1", action: "Sale", collection: "LilyPad Warriors", price: "5.2 PEPU", time: "2 min ago" },
    { id: "2", action: "Listed", collection: "Pepe Legends", price: "7.8 PEPU", time: "5 min ago" },
    { id: "3", action: "Bid", collection: "Crypto Frogs", price: "2.3 PEPU", time: "8 min ago" },
    { id: "4", action: "Sale", collection: "Digital Dragons", price: "10.5 PEPU", time: "12 min ago" }
  ];

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-play slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
    }, 5000);

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
                <div className="flex items-center space-x-2">
                  <Image 
                    src="/lily-removebg-preview.png" 
                    alt="LilyPad" 
                    width={32} 
                    height={32}
                    className="object-contain"
                  />
                  <span className="text-lg font-bold text-white">LilyPad</span>
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
              <div className="flex items-center space-x-2">
                <Image 
                  src="/lily-removebg-preview.png" 
                  alt="LilyPad" 
                  width={28} 
                  height={28}
                  className="object-contain"
                />
                <span className="text-xl font-bold text-white">LilyPad</span>
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
              
              {/* Navigation Items */}
              <div className="flex items-center space-x-3 ml-8">
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
            </div>
            
            <div className="flex items-center space-x-4">
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
              
              {/* Profile Icon */}
              <button className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
                <button className="w-full text-left px-4 py-3 text-blue-400 hover:bg-gray-800 rounded-lg transition-colors font-medium">
                  Dashboard
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
            
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Total Volume</div>
                <div className="text-white text-xl font-bold">12,450 PEPU</div>
                <div className="text-green-400 text-sm">+8.5%</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Floor Price</div>
                <div className="text-white text-xl font-bold">5.2 PEPU</div>
                <div className="text-green-400 text-sm">+2.1%</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Items Sold</div>
                <div className="text-white text-xl font-bold">1,234</div>
                <div className="text-green-400 text-sm">+15.3%</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Active Users</div>
                <div className="text-white text-xl font-bold">456</div>
                <div className="text-green-400 text-sm">+12.7%</div>
              </div>
            </div>

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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Collections */}
              <div className="lg:col-span-2">
                {/* Tabs Section */}
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

                {/* Collections List */}
                {activeTab === "Newest" ? (
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="text-xl font-bold text-white mb-4">Collections</div>
                    
                    <div className="space-y-3">
                      {filteredCollections.length > 0 ? (
                        filteredCollections.map((collection, index) => (
                          <div 
                            key={collection.id} 
                            className="flex items-center space-x-4 p-4 hover:bg-gray-800 transition-colors rounded-lg"
                          >
                            {/* Number */}
                            <div className="text-gray-400 font-bold text-lg w-8">
                              #{index + 1}
                            </div>
                            
                            {/* Image */}
                            <div className="w-24 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                              <Image 
                                src={collection.image_url} 
                                alt={collection.name} 
                                fill
                                className="object-cover"
                              />
                            </div>
                            
                            {/* Collection Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold text-lg truncate">{collection.name}</h3>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                                <span>{collection.items} items</span>
                                <span>{collection.minters} minters</span>
                              </div>
                            </div>
                            
                            {/* Price and Volume */}
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="text-center">
                                <div className="text-blue-400 font-bold text-lg">{collection.floor_price}</div>
                                <div className="text-gray-400 text-xs">PEPU</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-300 font-medium">{collection.volume}</div>
                                <div className="text-gray-400 text-xs">volume</div>
                              </div>
                              <div className={`text-sm font-medium ${collection.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                {collection.change}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="w-full">
                          {renderNoResults()}
                        </div>
                      )}
                    </div>
                    
                    {/* Show More Button */}
                    <div className="mt-6 text-center">
                      <button className="px-6 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                        Show More
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    {renderComingSoon(activeTab)}
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Trending Collections */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Trending</h3>
                  <div className="space-y-4">
                    {trendingCollections.map((collection, index) => (
                      <div key={collection.id} className="flex items-center space-x-3">
                        <div className="text-gray-400 font-bold text-sm w-6">#{index + 1}</div>
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image 
                            src={collection.image_url} 
                            alt={collection.name} 
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{collection.name}</h4>
                          <div className="text-gray-400 text-xs">{collection.floor} PEPU</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 text-sm font-medium">{collection.change}</div>
                          <div className="text-gray-400 text-xs">{collection.volume}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.action === 'Sale' ? 'bg-green-400' : 
                            activity.action === 'Listed' ? 'bg-blue-400' : 'bg-yellow-400'
                          }`}></div>
                          <span className="text-gray-300">{activity.action}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-white font-medium">{activity.collection}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-medium">{activity.price}</div>
                          <div className="text-gray-400 text-xs">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Launch NFT Collection
                    </button>
                    <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium border border-gray-700">
                      Create Auction
                    </button>
                    <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium border border-gray-700">
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image 
                  src="/lily-removebg-preview.png" 
                  alt="LilyPad" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
                <span className="text-xl font-bold text-white">LilyPad</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The #1 NFT marketplace on Pepe Unchained L2. Discover, collect, and trade unique digital assets. 
                Launch your NFT collection with ease.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Explore</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Create</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Stats</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Resources</a></li>
              </ul>
            </div>

            {/* NFT Services */}
            <div>
              <h3 className="text-white font-semibold mb-4">NFT Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Launch NFT</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">List Auction</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mint Collection</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Marketplace</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 LilyPad. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
