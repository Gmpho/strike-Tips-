import React from 'react';

const Gambling: React.FC = () => {
    return (
        <div className="py-16 md:py-24 max-w-4xl mx-auto">
            <header className="text-center">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-red-600 dark:text-red-500 leading-tight">
                    Responsible Gambling
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    Your well-being is our priority. Please gamble responsibly.
                </p>
            </header>
            <div className="mt-16 space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="text-lg">Horse Racing Analytics is committed to responsible gambling. While we provide AI-powered analysis and data, our service is for informational and entertainment purposes only. It is not intended to be a source of financial advice, and our predictions are not a guarantee of success.</p>
                
                <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                    <p className="font-bold text-yellow-800 dark:text-yellow-300">Important Principles:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Only bet what you can afford to lose.</li>
                        <li>Never chase your losses.</li>
                        <li>Set time and money limits before you start.</li>
                        <li>Gambling should not interfere with your personal relationships or responsibilities.</li>
                        <li>Do not gamble if you are under the influence of alcohol or other substances.</li>
                    </ul>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Getting Help</h2>
                <p>If you or someone you know has a gambling problem, help is available. Please reach out to one of the following confidential organizations for support:</p>
                <ul className="list-disc list-inside mt-2 space-y-2">
                    <li><strong>National Council on Problem Gambling:</strong> <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.ncpgambling.org</a></li>
                    <li><strong>Gamblers Anonymous:</strong> <a href="http://www.gamblersanonymous.org/ga/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.gamblersanonymous.org</a></li>
                    <li><strong>Gam-Anon:</strong> <a href="https://www.gam-anon.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.gam-anon.org</a></li>
                </ul>
            </div>
        </div>
    );
};

export default Gambling;
