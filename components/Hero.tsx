import React from 'react';
import { GoogleIcon } from './icons';
import { useAuth } from '../context/AuthContext';

const Hero: React.FC = () => {
  const { login } = useAuth();

  return (
    <section className="py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className="text-center lg:text-left">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
            Horse Racing Analytics
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0">
            Real-time predictions and RAG analysis for global horse racing
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button 
              onClick={login}
              className="w-full sm:w-auto px-8 py-3 text-base font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Get Started
            </button>
            <button
              onClick={login} 
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 text-base font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 transition-colors duration-200"
            >
              <GoogleIcon className="w-5 h-5" />
              Google Login
            </button>
          </div>
        </div>
        {/* Image Content */}
        <div className="relative flex items-center justify-center">
            <img 
                src="https://images.unsplash.com/photo-1598971821434-65153542289c?q=80&w=1974&auto=format&fit=crop" 
                alt="Two jockeys on racing horses competing intensely on a grass track" 
                className="rounded-lg z-10 max-w-full h-auto"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0D1117] via-transparent to-transparent z-20"></div>
             <svg className="absolute w-full h-full text-blue-500/30 z-0 top-4 left-4" fill="none" viewBox="0 0 200 100" >
                <path d="M0 50 Q 25 20, 50 50 T 100 50 T 150 50 T 200 50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;