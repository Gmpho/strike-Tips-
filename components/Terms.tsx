import React from 'react';

const Terms: React.FC = () => {
    return (
        <div className="py-16 md:py-24 max-w-4xl mx-auto">
            <header className="text-center">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                    Terms of Service
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    Last Updated: July 25, 2024
                </p>
            </header>
            <div className="mt-16 space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                <p>By accessing and using Horse Racing Analytics ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Service Description</h2>
                <p>The Service provides AI-generated predictions and analysis for horse racing events for informational purposes only. The information provided is not guaranteed to be accurate and should not be considered as financial or betting advice. We are not a gambling operator.</p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. User Conduct</h2>
                <p>You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the services of any third party, or the general business of Horse Racing Analytics.</p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Disclaimer of Warranties</h2>
                <p>The Service is provided "as is," without warranty of any kind. We expressly disclaim any and all warranties, whether express or implied, including, but not limited to, any implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Limitation of Liability</h2>
                <p>In no event shall Horse Racing Analytics, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            </div>
        </div>
    );
};

export default Terms;
