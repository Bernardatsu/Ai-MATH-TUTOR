
import React, { useState } from 'react';
import { Calculator, History, User as UserIcon, LogOut, Menu, X, ChevronDown, Video, Plus, GraduationCap } from 'lucide-react';
import { User, PageType } from '../types';

interface NavbarProps {
  user: User | null;
  onNavigate: (page: PageType) => void;
  onHistoryClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onNewChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onNavigate,
  onHistoryClick, 
  onLoginClick, 
  onLogoutClick,
  onNewChat
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavClick = (page: PageType) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const handleNewChatClick = () => {
    onNewChat();
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Section */}
          <button 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => handleNavClick('home')}
          >
            <div className="bg-indigo-600 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">
              Math<span className="text-indigo-600">Tutor</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={handleNewChatClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            <button onClick={() => handleNavClick('home')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Home</button>
            <button onClick={() => handleNavClick('video')} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              <Video className="w-4 h-4" />
              Video AI
            </button>
            <button onClick={() => handleNavClick('about')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">About</button>
            <button 
              onClick={onHistoryClick}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              History
            </button>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            {/* Auth Section */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-scale-in origin-top-right">
                      <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      </div>
                      <div className="p-1 border-t border-slate-50">
                        <button 
                          onClick={() => {
                            onLogoutClick();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md hover:shadow-lg font-medium text-sm transition-all"
              >
                <UserIcon className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-lg animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             <button 
              onClick={handleNewChatClick}
              className="w-full text-left px-3 py-2 rounded-md text-base font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
            <button onClick={() => handleNavClick('home')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Home</button>
            <button onClick={() => handleNavClick('video')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 flex items-center gap-2">
              <Video className="w-4 h-4" /> Video AI
            </button>
            <button onClick={() => handleNavClick('about')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">About</button>
            <button 
              onClick={() => {
                onHistoryClick();
                setIsMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
            >
              History
            </button>
            <div className="border-t border-slate-100 my-2"></div>
            {user ? (
              <>
                <div className="px-3 py-2">
                   <p className="text-sm font-medium text-slate-500">Signed in as {user.name}</p>
                   <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button 
                  onClick={() => {
                    onLogoutClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
