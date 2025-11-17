
import React, { useState } from 'react';
import { CheckIcon } from './icons';

const Pricing: React.FC = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

    const plans = {
        monthly: [
            {
                name: 'Paddock Pass',
                price: '$0',
                period: '/ month',
                description: 'For the casual fan looking to get started with AI-powered insights.',
                features: [
                    'Access to 2 race predictions per day',
                    'Basic race analysis',
                    'Limited global coverage',
                    'Email support',
                ],
                cta: 'Start for Free',
                isPrimary: false,
            },
            {
                name: "Winner's Circle",
                price: '$25',
                period: '/ month',
                description: 'The ultimate toolkit for the serious enthusiast and professional.',
                features: [
                    'Unlimited race predictions',
                    'Advanced RAG & performance analysis',
                    'Full global coverage',
                    'Real-time odds fluctuation alerts',
                    'J.A.R.V.I.S. AI voice companion',
                    'Priority email & chat support',
                ],
                cta: 'Choose Plan',
                isPrimary: true,
            },
            {
                name: "Steward's Suite",
                price: 'Custom',
                period: '',
                description: 'For syndicates, agencies, and high-volume professionals.',
                features: [
                    'All features from Winner\'s Circle',
                    'API access for custom integrations',
                    'Dedicated account manager',
                    'Bespoke model training',
                    'On-demand data exports',
                ],
                cta: 'Contact Sales',
                isPrimary: false,
            },
        ],
        annually: [
            {
                name: 'Paddock Pass',
                price: '$0',
                period: '/ year',
                description: 'For the casual fan looking to get started with AI-powered insights.',
                features: [
                    'Access to 2 race predictions per day',
                    'Basic race analysis',
                    'Limited global coverage',
                    'Email support',
                ],
                cta: 'Start for Free',
                isPrimary: false,
            },
            {
                name: "Winner's Circle",
                price: '$250',
                period: '/ year',
                description: 'The ultimate toolkit for the serious enthusiast and professional.',
                features: [
                    'Unlimited race predictions',
                    'Advanced RAG & performance analysis',
                    'Full global coverage',
                    'Real-time odds fluctuation alerts',
                    'J.A.R.V.I.S. AI voice companion',
                    'Priority email & chat support',
                ],
                cta: 'Choose Plan',
                isPrimary: true,
            },
            {
                name: "Steward's Suite",
                price: 'Custom',
                period: '',
                description: 'For syndicates, agencies, and high-volume professionals.',
                features: [
                    'All features from Winner\'s Circle',
                    'API access for custom integrations',
                    'Dedicated account manager',
                    'Bespoke model training',
                    'On-demand data exports',
                ],
                cta: 'Contact Sales',
                isPrimary: false,
            },
        ],
    };

    const faqs = [
        {
            question: "Can I upgrade or downgrade my plan at any time?",
            answer: "Yes, you can change your plan at any time from your account settings. The new plan will be prorated for the current billing cycle."
        },
        {
            question: "What happens if I exceed my daily prediction limit on the Paddock Pass?",
            answer: "You will be prompted to upgrade to the Winner's Circle plan to continue accessing predictions for the day. Your limit will reset the following day."
        },
        {
            question: "Is my payment information secure?",
            answer: "Absolutely. We use Stripe for payment processing, which is a certified PCI Service Provider Level 1. We do not store any of your card details on our servers."
        },
        {
            question: "What kind of support is included in the Winner's Circle plan?",
            answer: "Winner's Circle members get priority support via both email and live chat during business hours, ensuring you get the help you need, when you need it."
        }
    ];

    const currentPlans = plans[billingCycle];

    return (
        <div className="py-16 md:py-24">
            <header className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                    Choose Your Winning Edge
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    Simple, transparent pricing for every level of enthusiast. Unlock the full power of AI-driven horse racing analytics today.
                </p>
            </header>
            
            <div className="mt-12 flex justify-center">
                <div className="relative flex p-1 bg-gray-200 dark:bg-gray-800 rounded-full">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`w-full px-6 py-2 text-sm font-semibold rounded-full transition-colors ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annually')}
                        className="relative w-full px-6 py-2 text-sm font-semibold rounded-full transition-colors text-gray-600 dark:text-gray-400"
                    >
                        <span className={`absolute inset-0 rounded-full transition-all ${billingCycle === 'annually' ? 'bg-white dark:bg-gray-900/50 shadow' : ''}`}></span>
                        <span className="relative">Annually</span>
                        <span className="absolute -top-2 -right-3 text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full transform rotate-12">Save 2 Months</span>
                    </button>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {currentPlans.map((plan, index) => (
                    <div key={index} className={`flex flex-col rounded-2xl p-8 border ${plan.isPrimary ? 'bg-gray-900 dark:bg-gray-900/50 border-blue-500 ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-[#161B22] border-gray-200 dark:border-gray-800'}`}>
                        <h3 className={`text-xl font-bold ${plan.isPrimary ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                        <p className={`mt-4 text-sm ${plan.isPrimary ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'} flex-grow`}>{plan.description}</p>
                        <div className={`mt-8 ${plan.isPrimary ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                            {plan.period && <span className="text-sm font-semibold text-gray-500">{plan.period}</span>}
                        </div>
                        <a href="#" className={`mt-8 block w-full text-center rounded-md py-3 text-sm font-semibold transition-colors ${plan.isPrimary ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            {plan.cta}
                        </a>
                        <ul className={`mt-8 space-y-4 text-sm ${plan.isPrimary ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center">
                                    <CheckIcon className={`w-5 h-5 flex-shrink-0 ${plan.isPrimary ? 'text-blue-400' : 'text-blue-600'}`} />
                                    <span className="ml-3">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <section className="mt-20 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                <div className="mt-8 space-y-4">
                    {faqs.map((faq, index) => (
                         <details key={index} className="group p-4 bg-gray-100 dark:bg-[#161B22] rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
                            <summary className="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
                                {faq.question}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Pricing;
