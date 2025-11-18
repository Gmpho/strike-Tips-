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
import { Race } from './lib/gemini';


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
   * State to hold race data that needs to be passed between components,
   * specifically from the PredictionDashboard to the Chatbot for analysis.
   */
  const [raceToAnalyze, setRaceToAnalyze] = useState<Race | null>(null);


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

  /**
   * Sets the race data to be analyzed and navigates to the chat view.
   * @param race The race object from the prediction dashboard.
   */
  const handleAnalyzeWithChat = (race: Race) => {
    setRaceToAnalyze(race);
    navigateTo('chat');
  };

  /**
   * Renders the main content based on the current 'view' state.
   * This acts as a simple client-side router.
   */
  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        // This content now appears below the Hero component on the dashboard page.
        return (
            <>
              <Features />
              <PredictionDashboard 
                onAnalyzeWithCompanion={handleAnalyzeWithCompanion}
                onAnalyzeWithChat={handleAnalyzeWithChat}
                refreshTrigger={refreshTrigger} 
              />
            </>
        );
      case 'companion':
        return <AIChatCompanion navigateTo={navigateTo} onRefreshData={handleTriggerRefresh} />;
      case 'articles':
        return <Articles />;
      case 'story':
        return <Story />;
      case 'pricing':
        return <Pricing />;
      case 'chat':
        return <Chat raceToAnalyze={raceToAnalyze} setRaceToAnalyze={setRaceToAnalyze} />;
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
        return (
             <>
              <Features />
              <PredictionDashboard 
                onAnalyzeWithCompanion={handleAnalyzeWithCompanion}
                onAnalyzeWithChat={handleAnalyzeWithChat}
                refreshTrigger={refreshTrigger} 
              />
            </>
        );
    }
  };

  const isDashboardView = view === 'dashboard';

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen">
          
          {/* Layout for Dashboard View */}
          {isDashboardView ? (
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                  <Header currentView={view} navigateTo={navigateTo} isOverlay />
                </div>
              </div>
              <main>
                <Hero />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {renderContent()}
                </div>
              </main>
              <Footer navigateTo={navigateTo} currentView={view} />
            </div>
          ) : (
            // Layout for all other views
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <Header currentView={view} navigateTo={navigateTo} />
              <main>
                {renderContent()}
              </main>
              <Footer navigateTo={navigateTo} currentView={view} />
            </div>
          )}
          
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;