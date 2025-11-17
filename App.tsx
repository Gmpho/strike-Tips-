
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import PredictionDashboard from './components/PredictionDashboard';
import Footer from './components/Footer';
import AIChatCompanion from './components/AIChatCompanion';
import Articles from './components/Articles';
import Story from './components/Story';
import Pricing from './components/Pricing';
import Chat from './components/Chatbot';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export type View = 'dashboard' | 'companion' | 'articles' | 'story' | 'pricing' | 'chat';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigateTo = (newView: View) => {
    setView(newView);
    // Scroll to top on view change
    window.scrollTo(0, 0);
  };

  const handleTriggerRefresh = () => {
    setRefreshTrigger(c => c + 1);
  };

  const handleAnalyzeWithAi = () => {
    navigateTo('companion');
  };

  const DashboardContent = () => (
    <>
      <Hero />
      <Features />
      <PredictionDashboard onAnalyze={handleAnalyzeWithAi} refreshTrigger={refreshTrigger} />
    </>
  );

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardContent />;
      case 'companion':
        return <AIChatCompanion navigateTo={navigateTo} onRefreshData={handleTriggerRefresh} />;
      case 'articles':
        return <Articles />;
      case 'story':
        return <Story />;
      case 'pricing':
        return <Pricing />;
      case 'chat':
        return <Chat />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white min-h-screen flex flex-col">
          <div className="flex-grow">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <Header currentView={view} navigateTo={navigateTo} />
              <main>
                {renderContent()}
              </main>
            </div>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
