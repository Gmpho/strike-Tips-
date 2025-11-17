
import React from 'react';
import { PredictionIcon, GlobeIcon, FingerprintIcon } from './icons';

const Story: React.FC = () => {
    return (
        <div className="py-16 md:py-24">
            <header className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                    The Future of the Rails: Our Story
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    Fusing a lifelong passion for horse racing with the most advanced AI on the planet to create the ultimate analytical companion.
                </p>
            </header>

            <div className="mt-20 max-w-5xl mx-auto">
                <img 
                    src="https://storage.googleapis.com/aistudio-hosting/generative-ai-for-developers/images/horse_racing_panoramic.png" 
                    alt="A panoramic view of a horse race in action" 
                    className="rounded-lg shadow-2xl shadow-blue-900/10 w-full object-cover"
                />
            </div>

            <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Our Mission</h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                        The world of horse racing is rich with data, history, and nuance. For centuries, success has been a blend of intuition, experience, and meticulous study. We founded Horse Racing Analytics to level the playing field.
                    </p>
                    <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
                        Our mission is to democratize access to elite-level insights, empowering every enthusiast—from the weekend punter to the seasoned professional—with tools that were once unimaginable. We believe that by harnessing the power of AI, we can unlock a deeper, more engaging, and more rewarding experience for everyone who loves the sport of kings.
                    </p>
                </div>
                <div className="bg-gray-100 dark:bg-[#161B22] p-8 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Powered by Gemini AI</h3>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Our platform is built on Google's Gemini, the most capable and versatile AI model. This allows us to deliver:
                    </p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-start">
                            <PredictionIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400"><strong className="text-gray-800 dark:text-white">Real-time Predictions:</strong> Analyzing thousands of data points to forecast race outcomes with incredible accuracy.</span>
                        </li>
                        <li className="flex items-start">
                            <GlobeIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400"><strong className="text-gray-800 dark:text-white">Groundbreaking Analysis:</strong> Using Search Grounding to pull the latest news and information into its analysis.</span>
                        </li>
                         <li className="flex items-start">
                            <FingerprintIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400"><strong className="text-gray-800 dark:text-white">J.A.R.V.I.S. Companion:</strong> A voice-native AI assistant for a truly conversational and interactive experience.</span>
                        </li>
                    </ul>
                </div>
            </section>

             <section className="mt-20 text-center max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Join the Revolution</h2>
                 <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                    We're just getting started. The fusion of AI and horse racing is creating new frontiers of possibility. Whether you're here to gain an edge or simply deepen your appreciation for the sport, we invite you to be a part of the journey.
                </p>
                <div className="mt-10">
                    <a href="#predictions" className="px-8 py-3 text-base font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                        Get Started for Free
                    </a>
                </div>
            </section>
        </div>
    );
};

export default Story;
