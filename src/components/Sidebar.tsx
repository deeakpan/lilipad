import React from "react";
import Link from "next/link";
import { FaLayerGroup, FaChartBar, FaGift, FaShoppingBag, FaAward, FaPlusCircle, FaUser, FaHeart, FaHistory, FaBookmark, FaInfoCircle, FaBullhorn } from "react-icons/fa";
import { IconType } from "react-icons";

interface NavItem {
  name: string;
  icon: IconType;
  active: boolean;
  link?: string;
}

const navigationCategories: { [key: string]: NavItem[] } = {
  explore: [
    { name: "Collections", icon: FaLayerGroup, active: true, link: "/" },
    { name: "Stats", icon: FaChartBar, active: false },
    { name: "Drops", icon: FaGift, active: false },
    { name: "Marketplace", icon: FaShoppingBag, active: false },
    { name: "Rankings", icon: FaAward, active: false },
    { name: "Staking", icon: FaAward, active: false, link: "/stakes" },
  ],
  create: [
    { name: "Create Collection", icon: FaPlusCircle, active: false },
    { name: "Create NFT", icon: FaPlusCircle, active: false },
    { name: "My Collections", icon: FaLayerGroup, active: false },
  ],
  account: [
    { name: "Profile", icon: FaUser, active: false },
    { name: "Favorites", icon: FaHeart, active: false },
    { name: "Transaction History", icon: FaHistory, active: false },
    { name: "Watchlist", icon: FaBookmark, active: false },
  ],
  other: [
    { name: "About", icon: FaInfoCircle, active: true },
    { name: "News", icon: FaBullhorn, active: false },
  ]
};

export default function Sidebar({ mobile = false, collapsed = false, setCollapsed }: { mobile?: boolean, collapsed?: boolean, setCollapsed?: (v: boolean) => void } = {}) {
  const content = (
    <>
      <div className="sticky top-0 p-4 border-b-2 bg-black z-50" style={{ borderColor: '#32CD32' }}>
        <h2 className={`text-xl font-bold text-white text-left transition-all duration-300 ${collapsed ? 'hidden' : ''}`}>Menu</h2>
      </div>
      {/* Floating collapse/expand button for desktop */}
      {!mobile && setCollapsed && (
        <button
          className="hidden lg:flex items-center justify-center p-2 rounded-full border-2 border-[#32CD32] bg-[#111] hover:bg-[#222] transition-colors duration-200 text-white focus:outline-none shadow-lg"
          style={{ position: 'absolute', top: '50%', right: '-18px', transform: 'translateY(-50%)', zIndex: 1000 }}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="#32CD32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#32CD32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
      )}
      <div className="flex flex-col h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar" style={{ backgroundColor: '#000' }}>
        <nav className="flex-1 p-6">
          {Object.entries(navigationCategories).map(([category, items]) => (
            <div key={category + '-cat'} className="mb-6">
              <h3 className={`text-sm uppercase font-bold tracking-wider mb-3 transition-all duration-300 ${collapsed ? 'hidden' : ''}`} style={{ color: '#32CD32' }}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div className="space-y-3 pl-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return item.name === "Create Collection" ? (
                    <Link 
                      key={category + '-' + item.name} 
                      href="/create" 
                      className={`flex items-center gap-2 text-lg font-semibold w-full text-left text-white transition-all duration-300 cursor-default`}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                          <Icon size={collapsed ? 28 : 20} />
                        </span>
                        {!collapsed && <span>{item.name}</span>}
                    </Link>
                  ) : item.link ? (
                    <Link
                      key={category + '-' + item.name}
                      href={item.link}
                      className={`flex items-center gap-2 text-lg font-semibold w-full text-left text-white transition-all duration-300 cursor-pointer`}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                        <Icon size={collapsed ? 28 : 20} />
                      </span>
                        {!collapsed && <span>{item.name}</span>}
                    </Link>
                  ) : (
                    <div key={category + '-' + item.name} className={`flex items-center gap-2 text-lg font-semibold w-full text-left text-white transition-all duration-300 ${!item.active ? 'opacity-70 cursor-default' : ''}`}>
                      <span style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                        <Icon size={collapsed ? 28 : 20} />
                      </span>
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t-2" style={{ borderColor: '#32CD32' }}>
          <p className={`text-sm text-white text-center transition-all duration-300 ${collapsed ? 'hidden' : ''}`}>© 2025 LilyPad</p>
        </div>
      </div>
    </>
  );
  if (mobile) return content;
  return (
    <aside
      className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block h-screen border-r-2 transition-all duration-300 relative ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ backgroundColor: '#000', borderColor: '#32CD32' }}
    >
      {content}
    </aside>
  );
} 