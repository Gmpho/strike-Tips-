import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnalyzeIcon, VolumeUpIcon, RefreshIcon, MicrophoneIcon, ChatIcon } from './icons';
import { fetchRealtimeRaces, Race, Horse } from '../lib/gemini';
import { speak } from '../lib/audio';

/**
 * Determines the color of the confidence score text based on its value.
 * @param confidence The AI's confidence score (0-100).
 * @returns A string of Tailwind CSS classes for the color.
 */
const getConfidenceColor = (confidence: number) => {
  if (confidence > 85) return 'text-green-500 dark:text-green-400';
  if (confidence > 75) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-orange-500 dark:text-orange-400';
};

interface PredictionDashboardProps {
  onAnalyzeWithCompanion: () => void;
  onAnalyzeWithChat: () => void;
  refreshTrigger: number;
}

/**
 * Injects placeholder dynamic data into the race data fetched from the API.
 * This is used to simulate a more feature-rich frontend than what the model provides by default.
 * @param races The array of races from the Gemini API.
 * @returns The array of races with added dynamic data like confidence scores.
 */
const addDynamicData = (races: Race[]): Race[] => {
    return races.map(race => ({
        ...race,
        horses: race.horses.map(horse => ({
            ...horse,
            confidence: Math.floor(Math.random() * (98 - 70 + 1)) + 70, // Random confidence between 70-98
            jockeyStats: 'Top course jockey' // Placeholder
        }))
    }));
};

/**
 * The main dashboard component for displaying live horse racing predictions.
 * It handles fetching data, simulating real-time updates, managing UI state,
 * and responding to voice commands.
 */
const PredictionDashboard: React.FC<PredictionDashboardProps> = ({ onAnalyzeWithCompanion, onAnalyzeWithChat, refreshTrigger }) => {
    const { isAuthenticated, login } = useAuth();
    // State to manage which horse's details are expanded in each race.
    const [expandedRows, setExpandedRows] = useState<{ [key: number]: number | null }>({});
    // State to store the race data fetched from the API.
    const [races, setRaces] = useState<Race[]>([]);
    // State to track the initial loading state.
    const [loading, setLoading] = useState(true);
    // State to store and display any errors from the API or speech recognition.
    const [error, setError] = useState<string | null>(null);
    // State to track which horse odds have recently updated for a visual flash effect.
    const [updatedOdds, setUpdatedOdds] = useState<{ [key: string]: boolean }>({});
    // State to enable or disable text-to-speech feedback for odds changes.
    const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
    // State to track when a manual refresh is in progress.
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Ref to track the previous value of refreshTrigger to detect changes.
    const prevRefreshTriggerRef = useRef(refreshTrigger);
    // State for the Web Speech API to indicate when it's actively listening.
    const [isListening, setIsListening] = useState(false);
    // State to check if the browser supports the Web Speech API.
    const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
    // Ref to hold the SpeechRecognition instance.
    const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition vendor prefixes
    // State to manage which analysis dropdown is open
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);

    /**
     * Effect to close the analysis dropdown when clicking anywhere outside of it.
     */
    useEffect(() => {
        const closeDropdown = () => {
            setOpenDropdown(null);
        };
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, []);

    const handleToggleDropdown = (e: React.MouseEvent, raceId: number) => {
        e.stopPropagation();
        setOpenDropdown(prev => (prev === raceId ? null : raceId));
    };
    
    const handleAnalysisSelection = (analysisFn: () => void) => {
        analysisFn();
        setOpenDropdown(null);
    };

    /**
     * Memoized function to fetch race data from the Gemini API.
     * It handles setting loading/refreshing states and manages errors.
     * @param isManualRefresh - Differentiates between initial load and user-triggered refresh.
     */
    const loadRaces = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const raceData = await fetchRealtimeRaces();
            const racesWithDynamicData = addDynamicData(raceData);
            setRaces(racesWithDynamicData);
        } catch (err) {
            // Set the user-friendly error message from our enhanced error handling in gemini.ts
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred while fetching race data.');
            }
            console.error(err);
        } finally {
            if (isManualRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    /**
     * Effect for initial data loading and setting up an auto-refresh interval.
     * This runs only once when the component mounts and the user is authenticated.
     */
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        loadRaces();
        // Refresh data every 30 minutes to keep it relatively fresh.
        const intervalId = setInterval(() => loadRaces(), 30 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [isAuthenticated, loadRaces]);

    /**
     * Effect to handle manual refresh requests triggered from the parent component
     * (e.g., via a voice command in the AI Companion).
     */
    useEffect(() => {
        if (prevRefreshTriggerRef.current !== refreshTrigger && isAuthenticated) {
            loadRaces(true);
        }
        prevRefreshTriggerRef.current = refreshTrigger;
    }, [refreshTrigger, isAuthenticated, loadRaces]);

    /**
     * Effect to check for browser support for the Web Speech API on mount
     * and to clean up the recognition instance on unmount.
     */
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSpeechRecognitionSupported(!!SpeechRecognition);
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, []);
    
    /**
     * Toggles the voice command listener on and off.
     * It sets up the SpeechRecognition instance with callbacks for results, errors, and end of speech.
     */
    const handleToggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return; // onend will handle setting isListening to false
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        setError(null);
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = false; // Stop after first utterance
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log('Voice command received:', command);

            if (command.includes('refresh data')) {
                loadRaces(true);
                speak('Refreshing race data now.');
            } else if (command.includes('analyze race')) {
                onAnalyzeWithCompanion();
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error, event.message);
            let errorMessage = '';
            switch(event.error) {
                case 'no-speech':
                case 'aborted':
                    // These are common, non-critical events, so we can ignore them.
                    break;
                case 'audio-capture':
                    errorMessage = "Microphone not found or is in use. Please check your mic connection and browser permissions.";
                    break;
                case 'network':
                    errorMessage = "Network error: Speech recognition is unavailable. Please check your internet connection.";
                    break;
                case 'not-allowed':
                    errorMessage = "Microphone permission denied. Please enable it in your browser's settings for this site.";
                    break;
                case 'service-not-allowed':
                     errorMessage = "Speech recognition is not allowed by your browser or a security policy. Please check your browser settings.";
                    break;
                default:
                    errorMessage = `An unexpected speech error occurred (${event.error}). Please try again.`;
                    break;
            }
            if (errorMessage) setError(errorMessage);
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.start();
    };


    /**
     * Effect to simulate real-time odds fluctuations.
     * This adds a dynamic feel to the dashboard.
     */
    useEffect(() => {
        if (!isAuthenticated || races.length === 0) return;

        const fluctuateOdd = (currentOdd: string): string => {
            let odd = currentOdd;
            if (odd === 'EVS') odd = '1/1';
            
            const parts = odd.split('/');
            if (parts.length !== 2) return currentOdd;

            let numerator = parseInt(parts[0], 10);
            let denominator = parseInt(parts[1], 10);

            if (isNaN(numerator) || isNaN(denominator)) return currentOdd;

            const changeNumerator = Math.random() < 0.6;
            const increase = Math.random() < 0.5;

            if (changeNumerator) {
                numerator += increase ? 1 : -1;
            } else {
                denominator += increase ? 1 : -1;
            }

            if (numerator < 1) numerator = 1;
            if (denominator < 1) denominator = 1;
            
            if (numerator === denominator) return 'EVS';

            return `${numerator}/${denominator}`;
        };

        const intervalId = setInterval(() => {
            setRaces(currentRaces => {
                const announcements: string[] = [];
                const newUpdatedOdds: { [key: string]: boolean } = {};

                const updatedRaces = currentRaces.map(race => {
                    const updatedHorses = race.horses.map(horse => {
                        if (Math.random() < 0.4) { // 40% chance to update odds
                            const newOdd = fluctuateOdd((horse as any).odds);
                            if (newOdd !== (horse as any).odds) {
                                newUpdatedOdds[`${race.id}-${(horse as any).id}`] = true;
                                if (voiceFeedbackEnabled) {
                                    // Pronounce "EVS" as "evens" for better audio
                                    const oddsAnnouncement = newOdd === 'EVS' ? 'evens' : newOdd.replace('/', ' to ');
                                    announcements.push(`Odds for ${horse.name} have changed to ${oddsAnnouncement}`);
                                }
                                return { ...horse, odds: newOdd };
                            }
                        }
                        return horse;
                    });
                    return { ...race, horses: updatedHorses };
                });
                
                // Consolidate all announcements and make a single call to speak()
                if (voiceFeedbackEnabled && announcements.length > 0) {
                    const fullAnnouncement = announcements.join('. ');
                    speak(fullAnnouncement);
                }

                if (Object.keys(newUpdatedOdds).length > 0) {
                    setUpdatedOdds(prev => ({ ...prev, ...newUpdatedOdds }));
                    setTimeout(() => {
                        setUpdatedOdds(prev => {
                            const nextState = { ...prev };
                            Object.keys(newUpdatedOdds).forEach(key => delete nextState[key]);
                            return nextState;
                        });
                    }, 2000); // Visual flash duration
                }
                
                return updatedRaces;
            });
        }, 2000); // Update every 2 seconds

        return () => clearInterval(intervalId);
    }, [isAuthenticated, races.length, voiceFeedbackEnabled]);


    const handleToggleRow = (raceId: number, horseId: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [raceId]: prev[raceId] === horseId ? null : horseId
        }));
    };
    
    // Render a call-to-action if the user is not authenticated.
    if (!isAuthenticated) {
        return (
            <section className="py-16 md:py-24" id="predictions">
                <div className="text-center bg-gray-100 dark:bg-[#161B22] p-8 md:p-12 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">Access Live Predictions</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Sign in to view real-time data, detailed analysis, and AI-powered insights for upcoming races around the world.
                    </p>
                    <button 
                        onClick={login}
                        className="mt-8 px-8 py-3 text-base font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Sign In to View Dashboard
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section className="py-16 md:py-24" id="predictions">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Live Race Predictions</h2>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Real-time data and AI-powered insights for upcoming races.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                            voiceFeedbackEnabled
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                        }`}
                        aria-pressed={voiceFeedbackEnabled}
                    >
                        <VolumeUpIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{voiceFeedbackEnabled ? 'Voice ON' : 'Voice OFF'}</span>
                    </button>
                     <button
                        onClick={handleToggleListening}
                        disabled={!isSpeechRecognitionSupported}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isListening
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                        }`}
                        aria-label={isListening ? 'Stop listening for voice commands' : 'Start listening for voice commands'}
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Commands'}</span>
                    </button>
                    <button
                        onClick={() => loadRaces(true)}
                        disabled={isRefreshing || loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Refresh race data"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                         <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>
            
            {/* Conditional rendering for loading, error, and data states */}
            {loading && (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="ml-4 text-gray-600 dark:text-gray-400">Connecting to live data feed...</p>
                </div>
            )}

            {error && (
                <div className="text-center bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {!loading && !error && races.length > 0 && (
                <div className="space-y-12">
                    {races.map((race) => (
                        <div key={race.id} className="bg-white dark:bg-[#161B22] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg hover:shadow-blue-900/20 transition-shadow duration-300">
                            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        {race.course} - Race {race.raceNumber}
                                        {race.day === 'Tomorrow' && <span className="text-xs font-semibold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">Tomorrow</span>}
                                    </h3>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                                      <span>Track: <span className="font-semibold text-gray-700 dark:text-gray-300">{race.trackCondition}</span></span>
                                      <span className="hidden sm:inline">|</span>
                                      <span>Distance: <span className="font-semibold text-gray-700 dark:text-gray-300">{race.distance}</span></span>
                                      <span className="hidden sm:inline">|</span>
                                      <span>Prize: <span className="font-semibold text-green-600 dark:text-green-400">{race.prize}</span></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled At</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{race.startsIn}</p>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => handleToggleDropdown(e, race.id)} 
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600/90 dark:bg-blue-600/80 rounded-md hover:bg-blue-600 transition-colors"
                                            aria-haspopup="true"
                                            aria-expanded={openDropdown === race.id}
                                        >
                                            <AnalyzeIcon className="w-4 h-4" />
                                            Analyze
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openDropdown === race.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {openDropdown === race.id && (
                                            <div 
                                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#21262D] border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-20 origin-top-right"
                                                onClick={(e) => e.stopPropagation()}
                                                role="menu"
                                            >
                                                <ul className="py-1" role="none">
                                                    <li role="menuitem">
                                                        <button onClick={() => handleAnalysisSelection(onAnalyzeWithCompanion)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                                            <MicrophoneIcon className="w-4 h-4" />
                                                            With J.A.R.V.I.S. (Voice)
                                                        </button>
                                                    </li>
                                                    <li role="menuitem">
                                                        <button onClick={() => handleAnalysisSelection(onAnalyzeWithChat)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                                            <ChatIcon className="w-4 h-4" />
                                                            With Expert Chat
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#21262D]/30 hidden md:table-header-group">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Horse</th>
                                            <th scope="col" className="px-6 py-3">Jockey</th>
                                            <th scope="col" className="px-6 py-3">Odds</th>
                                            <th scope="col" className="px-6 py-3">AI Confidence</th>
                                            <th scope="col" className="px-6 py-3"><span className="sr-only">Details</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {race.horses.map((horse) => (
                                            <React.Fragment key={(horse as any).id}>
                                                <tr className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
                                                    {/* Mobile Card View */}
                                                    <td className="p-4 md:hidden" colSpan={5}>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div>
                                                                <p className="font-bold text-lg text-gray-900 dark:text-white">{horse.name}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">{horse.jockey}</p>
                                                            </div>
                                                            <div className={`font-mono text-lg transition-colors duration-1000 ${updatedOdds[`${race.id}-${(horse as any).id}`] ? 'bg-yellow-400/20 rounded px-2' : 'bg-transparent'}`}>
                                                                {(horse as any).odds}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold w-10 ${getConfidenceColor((horse as any).confidence)}`}>{(horse as any).confidence}%</span>
                                                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div className={`h-2 rounded-full ${getConfidenceColor((horse as any).confidence).replace('text-green-500', 'bg-green-500').replace('text-yellow-500', 'bg-yellow-500').replace('text-orange-500', 'bg-orange-500').replace('dark:text-green-400', 'dark:bg-green-400').replace('dark:text-yellow-400', 'dark:bg-yellow-400').replace('dark:text-orange-400', 'dark:bg-orange-400')}`} style={{ width: `${(horse as any).confidence}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleToggleRow(race.id, (horse as any).id)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1">
                                                                Details
                                                                {/* FIX: Removed duplicate attributes from SVG element */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${expandedRows[race.id] === (horse as any).id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Desktop Table View */}
                                                    <td scope="row" className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap hidden md:table-cell">
                                                        {horse.name}
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell">
                                                        {horse.jockey}
                                                    </td>
                                                    <td className={`px-6 py-4 font-mono transition-colors duration-1000 hidden md:table-cell ${updatedOdds[`${race.id}-${(horse as any).id}`] ? 'bg-yellow-400/20' : 'bg-transparent'}`}>
                                                        {(horse as any).odds}
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold w-10 ${getConfidenceColor((horse as any).confidence)}`}>{(horse as any).confidence}%</span>
                                                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div className={`h-2 rounded-full ${getConfidenceColor((horse as any).confidence).replace('text-green-500', 'bg-green-500').replace('text-yellow-500', 'bg-yellow-500').replace('text-orange-500', 'bg-orange-500').replace('dark:text-green-400', 'dark:bg-green-400').replace('dark:text-yellow-400', 'dark:bg-yellow-400').replace('dark:text-orange-400', 'dark:bg-orange-400')}`} style={{ width: `${(horse as any).confidence}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right hidden md:table-cell">
                                                        <button onClick={() => handleToggleRow(race.id, (horse as any).id)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                                            {expandedRows[race.id] === (horse as any).id ? 'Hide' : 'Details'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedRows[race.id] === (horse as any).id && (
                                                    <tr className="bg-gray-100/50 dark:bg-gray-800/20">
                                                        <td colSpan={5} className="p-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase">Form</p>
                                                                    <p className="font-bold text-gray-800 dark:text-white mt-1">{horse.form}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase">Weight</p>
                                                                    <p className="font-bold text-gray-800 dark:text-white mt-1">9-5</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase">Trainer</p>
                                                                    <p className="font-bold text-gray-800 dark:text-white mt-1">A P O'Brien</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase">Jockey Stats</p>
                                                                    <p className="font-bold text-gray-800 dark:text-white mt-1">{(horse as any).jockeyStats}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && races.length === 0 && (
                 <div className="text-center bg-gray-100 dark:bg-[#161B22] p-8 md:p-12 rounded-lg border border-gray-200 dark:border-gray-800">
                    <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">No Races Found</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        There are no upcoming races matching the criteria for today or tomorrow. Please check back later or refresh.
                    </p>
                </div>
            )}
        </section>
    );
};

export default PredictionDashboard;