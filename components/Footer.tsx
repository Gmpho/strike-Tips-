import React from 'react';
import { AbstractHorseLogo } from './icons';
import { View } from '../App';

interface FooterProps {
  navigateTo: (view: View) => void;
  currentView: View;
}

const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 md:mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                <div className="col-span-2 lg:col-span-1 space-y-4">
                    <button onClick={() => navigateTo('dashboard')} className="flex items-center space-x-2 text-gray-900 dark:text-white">
                        <AbstractHorseLogo className="w-8 h-8" />
                        <span className="font-bold text-lg">EQUI • VISION</span>
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400">The future of horse racing analytics, powered by AI.</p>
                </div>
                
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Platform</h4>
                    <ul className="mt-4 space-y-2">
                        <li><button onClick={() => navigateTo('dashboard')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</button></li>
                        <li><button onClick={() => navigateTo('story')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Our Story</button></li>
                        <li><button onClick={() => navigateTo('pricing')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</button></li>
                        <li><button onClick={() => navigateTo('updates')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Updates</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Company</h4>
                    <ul className="mt-4 space-y-2">
                        <li><button onClick={() => navigateTo('contact')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Us</button></li>
                        <li><button onClick={() => navigateTo('careers')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Careers</button></li>
                         <li><a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Gemini</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Legal</h4>
                    <ul className="mt-4 space-y-2">
                        <li><button onClick={() => navigateTo('terms')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</button></li>
                        <li><button onClick={() => navigateTo('privacy')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</button></li>
                        <li><button onClick={() => navigateTo('gambling')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Responsible Gambling</button></li>
                    </ul>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
                 <p className="text-gray-500 dark:text-gray-500 text-sm">
                    © {new Date().getFullYear()} Horse Racing Analytics. All rights reserved.
                </p>
                <p className="text-gray-500 dark:text-gray-600 text-xs mt-2 max-w-3xl mx-auto">
                    Disclaimer: This service uses AI-generated predictions which are for informational purposes only. They are not guaranteed to be accurate. This is not financial advice. Please gamble responsibly.
                </p>
            </div>
        </div>
    </footer>
  );
};

export default Footer;