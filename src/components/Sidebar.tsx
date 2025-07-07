import React from "react";
import { FaLayerGroup, FaChartBar, FaGift, FaShoppingBag, FaAward, FaPlusCircle, FaUser, FaHeart, FaHistory, FaBookmark, FaInfoCircle, FaBullhorn } from "react-icons/fa";

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

export default function Sidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const content = (
    <>
      <div className="sticky top-0 p-6 border-b-2" style={{ backgroundColor: '#000', borderColor: '#39FF14' }}>
        <h2 className="text-xl font-bold text-[#39FF14] text-left">Menu</h2>
      </div>
      <div className="flex flex-col h-[calc(100vh-5rem)] overflow-y-auto" style={{ backgroundColor: '#000' }}>
        <nav className="flex-1 p-6">
          {Object.entries(navigationCategories).map(([category, items]) => (
            <div key={category + '-cat'} className="mb-6">
              <h3 className="text-sm uppercase text-[#39FF14] font-bold tracking-wider mb-3">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div className="space-y-3 pl-1">
                {items.map((item) => (
                  <div key={category + '-' + item.name} className={`flex items-center gap-2 text-lg font-semibold w-full text-left text-[#39FF14] ${!item.active ? 'opacity-70 cursor-default' : ''}`}>{item.icon} {item.name}</div>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t-2" style={{ borderColor: '#39FF14' }}>
          <p className="text-sm text-[#39FF14] text-center">© 2025 LilyPad</p>
        </div>
      </div>
    </>
  );
  if (mobile) return content;
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block w-64 h-screen border-r-2" style={{ backgroundColor: '#000', borderColor: '#39FF14' }}>
      {content}
    </aside>
  );
} 