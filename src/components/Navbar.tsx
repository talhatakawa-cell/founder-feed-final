import { Link } from 'react-router-dom';
import {
  Rocket,
  User,
  LogOut,
  ShieldAlert,
  MessageSquare,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { User as UserType } from '../types';
import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
  unreadCount?: number;
}

export default function Navbar({
  user,
  onLogout,
  unreadCount = 0, // ✅ default value added
}: NavbarProps) {
  const location = useLocation();
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'dark'
    
  );
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
const [showDropdown, setShowDropdown] = useState(false);

const [showMobileSearch, setShowMobileSearch] = useState(false);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
  if (showMobileSearch) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [showMobileSearch]);

 useEffect(() => {
  setShowDropdown(false);
}, [location]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" && searchTerm.trim()) {
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setShowMobileSearch(false);
  }
};

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
     <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-500 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <Rocket className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
            FounderFeed
          </span>
        </Link>
        {/* Desktop Search */}
<div className="hidden md:flex flex-1 max-w-md mx-6">
  <div className="relative w-full">
    
    {/* Search Icon */}
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />

    <input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={handleSearch}
  placeholder="Search founders, posts..."
      className="w-full pl-10 pr-4 py-2.5
                 bg-zinc-100 dark:bg-zinc-800
                 rounded-full
                 text-sm
                 focus:outline-none
                 focus:ring-2
                 focus:ring-emerald-500/50
                 transition-all"
    />
  </div>
</div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Search Button */}
<button
  onClick={() => setShowMobileSearch(true)}
  className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
>
  <Search className="w-5 h-5" />
</button>

          {user ? (
            <>
              {/* Launch */}
              <Link
                to="/launch"
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 flex items-center gap-2 px-3"
              >
                <Rocket className="w-5 h-5" />
                <span className="text-sm font-bold hidden lg:block">
                  Launch
                </span>
              </Link>

              {/* Messages */}
              <Link
                to="/messages"
                className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-emerald-500"
              >
                <MessageSquare className="w-5 h-5" />

                {/* ✅ Fixed Badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Admin */}
              <Link
                to="/admin"
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-orange-500"
              >
                <ShieldAlert className="w-5 h-5" />
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  )}
                </div>
                <span className="text-sm font-medium hidden md:block text-zinc-700 dark:text-zinc-300">
                  {user.name}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-500/10 text-zinc-500 dark:text-zinc-400 hover:text-red-500 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-full text-sm font-bold transition-colors"
            >
              Join
            </Link>
          )}
        </div>
      </div>
    {/* Mobile Search Overlay */}
{showMobileSearch && (
  <div className="fixed inset-0 md:hidden z-[9999] bg-black/50 backdrop-blur-sm flex flex-col">

    {/* Top Search Bar Container */}
    <div className="bg-white dark:bg-zinc-950 p-4 shadow-md">

      <div className="flex items-center gap-3">
        
        {/* Clear Back Button */}
        <button
          onClick={() => setShowMobileSearch(false)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
        >
          ←
        </button>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />

          <input
  autoFocus
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={handleSearch}
  placeholder="Search founders, posts..."
  className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full focus:outline-none"
/>
        </div>
      </div>

    </div>

    {/* Rest Area (Results will go here later) */}
    <div className="flex-1 bg-white dark:bg-zinc-950 p-4 overflow-y-auto">
      {/* You can show recent searches or results here */}
    </div>

  </div>
)}
    </nav>
  );
}