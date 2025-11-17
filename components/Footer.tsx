
import React from 'react';
import { AbstractHorseLogo } from './icons';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 md:mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                        <AbstractHorseLogo className="w-8 h-8" />
                        <span className="font-bold text-xl">Horse Racing Analytics</span>
                    </div>
                     <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
                        AI-powered predictions and insights for global horse racing.
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Product</h4>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Features</a></li>
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Pricing</a></li>
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Updates</a></li>
                    </ul>
                </div>
                <div>
                     <h4 className="font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Company</h4>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">About</a></li>
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Contact Us</a></li>
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Careers</a></li>
                    </ul>
                </div>
                 <div>
                     <h4 className="font-semibold text-gray-900 dark:text-white tracking-wider uppercase">Legal & Safety</h4>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Terms of Service</a></li>
                        <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">Privacy Policy</a></li>
                        <li><a href="#" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold">Responsible Gambling</a></li>
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