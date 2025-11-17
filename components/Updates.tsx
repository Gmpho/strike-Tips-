import React from 'react';

const Updates: React.FC = () => {
    return (
        <div className="py-16 md:py-24 max-w-4xl mx-auto">
            <header className="text-center">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                    Platform Updates
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    Stay informed about the latest features, improvements, and news from the Horse Racing Analytics team.
                </p>
            </header>
            <div className="mt-16 space-y-12 text-gray-600 dark:text-gray-400">
                <article>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">v2.1.0: Real-Time Data Enhancements</h2>
                    <p className="text-sm text-gray-500 mb-4"><em>Posted: August 1, 2024</em></p>
                    <p className="mb-4">This update brings significant improvements to our real-time data pipeline, resulting in faster odds updates and more accurate track condition reporting. The J.A.R.V.I.S. companion now has access to an even wider array of live data points for more nuanced analysis.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Improved data refresh rates on the main dashboard.</li>
                        <li>Added support for 5 new international racetracks.</li>
                        <li>Enhanced AI model for better understanding of jockey performance statistics.</li>
                    </ul>
                </article>
                <hr className="border-gray-200 dark:border-gray-800" />
                <article>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">v2.0.0: Introducing J.A.R.V.I.S.</h2>
                    <p className="text-sm text-gray-500 mb-4"><em>Posted: July 15, 2024</em></p>
                    <p>The groundbreaking release of our J.A.R.V.I.S. AI Voice Companion. This update revolutionized how users can interact with horse racing data, offering a fully conversational, voice-native experience powered by the Gemini Live API.</p>
                </article>
            </div>
        </div>
    );
};

export default Updates;
