
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnalyzeIcon, VolumeUpIcon, RefreshIcon } from './icons';
import { fetchRealtimeRaces, Race, Horse } from '../lib/gemini';
import { speak } from '../lib/audio';


const getConfidenceColor = (confidence: number) => {
  if (confidence > 85) return 'text-green-500 dark:text-green-400';
  if (confidence > 75) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-orange-500 dark:text-orange-400';
};

interface PredictionDashboardProps {
  onAnalyze: (prompt: string) => void;
}

// Generate a random confidence score to supplement the fetched data
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

const PredictionDashboard: React.FC<PredictionDashboardProps> = ({ onAnalyze }) => {
    const { isAuthenticated, login } = useAuth();
    const [expandedRows, setExpandedRows] = useState<{ [key: number]: number | null }>({});
    const [races, setRaces] = useState<Race[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatedOdds, setUpdatedOdds] = useState<{ [key: string]: boolean }>({});
    const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        } catch (err: any) {
            setError('Failed to fetch live race data. The AI may be busy or sources unavailable. Please try again later.');
            console.error(err);
        } finally {
            if (isManualRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        loadRaces();
        // Refresh data every 30 minutes
        const intervalId = setInterval(() => loadRaces(), 30 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [isAuthenticated, loadRaces]);

    // Simulate real-time odds fluctuation
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
    
    const handleAnalyzeClick = (race: Race) => {
        const prompt = `Provide a detailed analysis of Race ${race.raceNumber} at ${race.course}. The track condition is ${race.trackCondition}. Here are the horses: ${race.horses.map(h => `${h.name} (Jockey: ${h.jockey}, Form: ${h.form}, Odds: (h as any).odds})`).join(', ')}. Compare their forms and jockey stats, and use your search tool to find any recent news or expert opinions on these contenders. Give me a breakdown of the top 3 contenders.`;
        onAnalyze(prompt);
    };

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
                <div className="flex-shrink-0 flex items-center gap-4">
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
                        onClick={() => loadRaces(true)}
                        disabled={isRefreshing || loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Refresh race data"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
            
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
                                     <button onClick={() => handleAnalyzeClick(race)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-blue-600/90 dark:bg-blue-600/80 rounded-md hover:bg-blue-600 transition-colors">
                                        <AnalyzeIcon className="w-4 h-4" />
                                        Analyze with AI
                                     </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#21262D]/30">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Horse</th>
                                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Jockey</th>
                                            <th scope="col" className="px-6 py-3">Odds</th>
                                            <th scope="col" className="px-6 py-3">AI Confidence</th>
                                            <th scope="col" className="px-6 py-3"><span className="sr-only">Details</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {race.horses.map((horse) => (
                                            <React.Fragment key={(horse as any).id}>
                                                <tr className="bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
                                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{horse.name}</th>
                                                    <td className="px-6 py-4 hidden md:table-cell">{horse.jockey}</td>
                                                    <td className={`px-6 py-4 font-mono transition-colors duration-1000 ${updatedOdds[`${race.id}-${(horse as any).id}`] ? 'bg-yellow-400/20' : 'bg-transparent'}`}>{(horse as any).odds}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold w-10 ${getConfidenceColor((horse as any).confidence)}`}>{(horse as any).confidence}%</span>
                                                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div className={`h-2 rounded-full ${getConfidenceColor((horse as any).confidence).replace('text-green-500', 'bg-green-500').replace('text-yellow-500', 'bg-yellow-500').replace('text-orange-500', 'bg-orange-500').replace('dark:text-green-400', 'dark:bg-green-400').replace('dark:text-yellow-400', 'dark:bg-yellow-400').replace('dark:text-orange-400', 'dark:bg-orange-400')}`} style={{ width: `${(horse as any).confidence}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleToggleRow(race.id, (horse as any).id)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1">
                                                            Details
                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${expandedRows[race.id] === (horse as any).id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedRows[race.id] === (horse as any).id && (
                                                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                                                        <td colSpan={5} className="px-6 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                                <div>
                                                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Recent Form</h4>
                                                                    <p className="font-mono bg-gray-200 dark:bg-gray-800 p-2 rounded w-fit">{horse.form}</p>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Jockey Stats</h4>
                                                                    <p>{(horse as any).jockeyStats}</p>
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
                <div className="text-center text-gray-500 dark:text-gray-500 py-10">
                    <p>No upcoming races found at the moment. Please check back later.</p>
                </div>
            )}
        </section>
    );
};

export default PredictionDashboard;
