import React from 'react';

const Privacy: React.FC = () => {
    return (
        <div className="py-16 md:py-24 max-w-4xl mx-auto">
            <header className="text-center">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                    Privacy Policy
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    Last Updated: July 25, 2024
                </p>
            </header>
            <div className="mt-16 space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
                <p>We may collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products and services, when you participate in activities on the Service or otherwise when you contact us.</p>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
                <p>We use personal information collected via our Service for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Will Your Information Be Shared With Anyone?</h2>
                <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information to third parties.</p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. How We Keep Your Information Safe</h2>
                <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
            </div>
        </div>
    );
};

export default Privacy;
