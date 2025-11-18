

import React, { useState, useEffect } from 'react';
import { AbstractHorseLogo, GoogleIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { View } from '../App';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentView: View;
  navigateTo: (view: View) => void;
  isOverlay?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, navigateTo, isOverlay = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, login } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleNavClick = (view: View) => {
    navigateTo(view);
    setIsMenuOpen(false);
  };
  
  const getNavLinkClasses = (view: View) => {
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 backdrop-blur-sm";
    const isActive = currentView === view;

    if (isOverlay) {
        if (theme === 'light') {
            if (isActive) {
                return `${baseClasses} bg-black/10 text-gray-900 font-semibold`;
            }
            return `${baseClasses} text-gray-700 hover:bg-black/5 hover:text-gray-900`;
        } else { // Dark theme
            if (isActive) {
                return `${baseClasses} bg-white/20 border border-white/20 text-white`;
            }
            return `${baseClasses} bg-white/5 border border-transparent text-gray-300 hover:bg-white/20 hover:text-white`;
        }
    }
    
    // Standard page styles (dark mode aware)
    if (isActive) {
        return `${baseClasses} bg-blue-50 dark:bg-white/20 border border-blue-200 dark:border-white/20 text-blue-600 dark:text-white`;
    }
    return `${baseClasses} bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white`;
  }
  
  const getAboutLinkClasses = () => {
      const baseClasses = "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 backdrop-blur-sm";
      if(isOverlay) {
          if (theme === 'light') {
              return `${baseClasses} text-gray-700 hover:bg-black/5 hover:text-gray-900`;
          }
          return `${baseClasses} bg-white/5 border border-transparent text-gray-300 hover:bg-white/20 hover:text-white`;
      }
      return `${baseClasses} bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white`;
  }

  const getSignInButtonClasses = () => {
    const baseClasses = "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2";
    if (isOverlay) {
        if (theme === 'light') {
            return `${baseClasses} bg-black/5 border border-gray-900/10 text-gray-900 hover:bg-black/10`;
        }
        return `${baseClasses} bg-white/10 border border-white/20 text-white hover:bg-white/20`;
    }
    return `${baseClasses} bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20`;
  }

  const logoColorClass = isOverlay && theme === 'light' ? 'text-gray-900' : isOverlay ? 'text-white' : 'text-gray-900 dark:text-white';
  const hamburgerColorClass = isOverlay && theme === 'light' ? 'text-gray-900' : isOverlay ? 'text-white' : 'text-gray-900 dark:text-white';

  return (
    <header className="py-6">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <button onClick={() => handleNavClick('dashboard')} className={`flex items-center space-x-2 cursor-pointer ${logoColorClass}`}>
            <AbstractHorseLogo className="w-8 h-8" />
            <span className="font-bold text-lg hidden sm:inline">EQUI • VISION</span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
             <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('dashboard')}} className={getNavLinkClasses('dashboard')}>
                Dashboard
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('story')}} className={getNavLinkClasses('story')}>
                Story
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('pricing')}} className={getNavLinkClasses('pricing')}>
                Pricing
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('companion')}} className={getNavLinkClasses('companion')}>
                AI Companion
             </a>
             <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('chat')}} className={getNavLinkClasses('chat')}>
                Expert Chat
             </a>
             <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className={getAboutLinkClasses()}>
                About
             </a>
          </div>
          <ThemeToggle />
          {isAuthenticated ? (
             <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600/80 dark:bg-red-600/50 border border-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600/70 transition-colors duration-200 backdrop-blur-sm"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={login}
              className={getSignInButtonClasses()}
            >
              <GoogleIcon className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
          <button className={`md:hidden ${hamburgerColorClass}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
             </svg>
          </button>
        </div>
      </nav>
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-gray-100 dark:bg-[#161B22] rounded-lg p-4">
          <div className="flex flex-col space-y-2">
            <button onClick={() => handleNavClick('dashboard')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Dashboard</button>
            <button onClick={() => handleNavClick('story')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Story</button>
            <button onClick={() => handleNavClick('pricing')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Pricing</button>
            <button onClick={() => handleNavClick('companion')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">AI Companion</button>
            <button onClick={() => handleNavClick('chat')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Expert Chat</button>
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">About</a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;