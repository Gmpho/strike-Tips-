
import React, { useState, useEffect } from 'react';
import { AbstractHorseLogo } from './icons';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { View } from '../App';

interface HeaderProps {
  currentView: View;
  navigateTo: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, navigateTo }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

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
  
  const getLinkClasses = (view: View) => {
    return `text-sm font-medium transition-colors duration-200 ${currentView === view ? 'text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`;
  }


  return (
    <header className="py-6">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <button onClick={() => handleNavClick('dashboard')} className="flex items-center space-x-2 cursor-pointer text-gray-900 dark:text-white">
            <AbstractHorseLogo className="w-8 h-8" />
          </button>
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => handleNavClick('dashboard')} className={getLinkClasses('dashboard')}>
              Home
            </button>
            <button onClick={() => handleNavClick('story')} className={getLinkClasses('story')}>
              Story
            </button>
            <button onClick={() => handleNavClick('pricing')} className={getLinkClasses('pricing')}>
              Pricing
            </button>
             <button onClick={() => handleNavClick('companion')} className={getLinkClasses('companion')}>
              AI Companion
             </button>
             <button onClick={() => handleNavClick('chat')} className={getLinkClasses('chat')}>
              Chat
             </button>
             <button onClick={() => handleNavClick('articles')} className={getLinkClasses('articles')}>
              Articles
             </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-8">
             <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm font-medium">
                About
             </a>
          </div>
          <ThemeToggle />
          {isAuthenticated ? (
             <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600/80 dark:bg-red-600/50 border border-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600/70 transition-colors duration-200"
            >
              Sign Out
            </button>
          ) : (
            <a
              href="#predictions"
              onClick={(e) => {
                if(currentView !== 'dashboard') {
                  e.preventDefault();
                  navigateTo('dashboard');
                   setTimeout(() => document.getElementById('predictions')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-white/20 transition-colors duration-200"
            >
              Sign In
            </a>
          )}
          <button className="md:hidden text-gray-900 dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
             </svg>
          </button>
        </div>
      </nav>
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-gray-100 dark:bg-[#161B22] rounded-lg p-4">
          <div className="flex flex-col space-y-2">
            <button onClick={() => handleNavClick('dashboard')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Home</button>
            <button onClick={() => handleNavClick('story')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Story</button>
            <button onClick={() => handleNavClick('pricing')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Pricing</button>
            <button onClick={() => handleNavClick('companion')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">AI Companion</button>
            <button onClick={() => handleNavClick('chat')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Chat</button>
            <button onClick={() => handleNavClick('articles')} className="text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">Articles</button>
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 p-2 rounded">About</a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
