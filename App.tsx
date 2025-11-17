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
import Updates from './components/Updates';
import Contact from './components/Contact';
import Careers from './components/Careers';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Gambling from './components/Gambling';


/**
 * Defines the possible views/pages a user can navigate to within the application.
 * This type is used to control which component is rendered as the main content.
 */
export type View = 'dashboard' | 'companion' | 'articles' | 'story' | 'pricing' | 'chat' | 'updates' | 'contact' | 'careers' | 'terms' | 'privacy' | 'gambling';

/**
 * The root component of the application.
 * It orchestrates the overall layout, including the Header and Footer,
 * and manages the current view (page) being displayed. It also handles
 * the global state for theme and authentication through context providers.
 */
const App: React.FC = () => {
  // State to track the current active view. Defaults to 'dashboard'.
  const [view, setView] = useState<View>('dashboard');

  /**
   * State to trigger a manual data refresh in child components.
   * This is a simple but effective mechanism for parent-child communication.
   * When a child component (like AIChatCompanion) needs to trigger a data fetch
   * in another child (like PredictionDashboard), it calls a function that increments
   * this trigger. The dashboard then listens for changes to this value via props.
   */
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Handles navigation between different views of the application.
   * @param newView The view to navigate to.
   */
  const navigateTo = (newView: View) => {
    setView(newView);
    // Ensure the user is at the top of the page after a view change.
    window.scrollTo(0, 0);
  };

  /**
   * Callback function passed to child components that need to trigger a global data refresh.
   * Increments the refreshTrigger state, causing components that depend on it to update.
   */
  const handleTriggerRefresh = () => {
    setRefreshTrigger(c => c + 1);
  };

  const handleAnalyzeWithCompanion = () => {
    navigateTo('companion');
  };

  const handleAnalyzeWithChat = () => {
    navigateTo('chat');
  };

  /**
   * A functional component to group the content of the main dashboard view.
   * This keeps the main render logic cleaner.
   */
  const DashboardContent = () => (
    <>
      <Hero />
      <Features />
      <PredictionDashboard 
        onAnalyzeWithCompanion={handleAnalyzeWithCompanion}
        onAnalyzeWithChat={handleAnalyzeWithChat}
        refreshTrigger={refreshTrigger} 
      />
    </>
  );

  /**
   * Renders the main content based on the current 'view' state.
   * This acts as a simple client-side router.
   */
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
      case 'updates':
        return <Updates />;
      case 'contact':
        return <Contact />;
      case 'careers':
        return <Careers />;
      case 'terms':
        return <Terms />;
      case 'privacy':
        return <Privacy />;
      case 'gambling':
        return <Gambling />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    // Wrap the entire application in context providers for global state management.
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
          <Footer navigateTo={navigateTo} currentView={view} />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;