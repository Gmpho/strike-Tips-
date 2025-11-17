

import React from 'react';
import { PredictionIcon, GlobeIcon, FingerprintIcon } from './icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white dark:bg-[#161B22] p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20">
      <div className="mb-5">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const featuresData: FeatureCardProps[] = [
    {
      icon: <PredictionIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />,
      title: 'Real Time Prediction',
      description: 'AI-powered predictions with real-time odds for every race',
    },
    {
      icon: <GlobeIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />,
      title: 'Global Coverage',
      description: 'Analysis and insights for horse races worldwide',
    },
    {
      icon: <FingerprintIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />,
      title: 'RAG Analysis',
      description: 'Retrieve and analyze documents to inform decision-making',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featuresData.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};

export default Features;