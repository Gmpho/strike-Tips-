import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchRacingArticles, Article } from '../lib/gemini';
import { RefreshIcon } from './icons';

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => (
    <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex flex-col group transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20">
        <div className="aspect-video overflow-hidden">
            <img 
                src={article.imageUrl || 'https://storage.googleapis.com/aistudio-hosting/generative-ai-for-developers/images/horse_racing_2.png'} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase">{article.source}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 flex-grow">{article.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{article.summary}</p>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
             <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Read More &rarr;
            </a>
        </div>
    </div>
);

const Articles: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const cooldownIntervalRef = useRef<number | null>(null);

    const loadArticles = useCallback(async (forceRefresh = false) => {
        if (forceRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const articleData = await fetchRacingArticles(forceRefresh);
            setArticles(articleData);
        } catch (err) {
            // Set the user-friendly error message from our enhanced error handling
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred while fetching articles.');
            }
            console.error(err);
        } finally {
             if (forceRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadArticles();
        // Refresh articles every 4 hours, bypassing the cache
        const intervalId = setInterval(() => loadArticles(true), 4 * 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [loadArticles]);

    useEffect(() => {
        if (cooldown > 0) {
            cooldownIntervalRef.current = window.setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        } else if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
        }
        return () => {
            if (cooldownIntervalRef.current) {
                clearInterval(cooldownIntervalRef.current);
            }
        };
    }, [cooldown]);

    const handleRefresh = () => {
        if (cooldown > 0 || isRefreshing) return;
        loadArticles(true);
        setCooldown(15);
    };


    return (
        <section className="py-16 md:py-24">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Latest Racing News</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Fresh insights and stories from the world of horse racing, powered by AI.</p>
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading || cooldown > 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Refresh articles"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                         <span className="w-24 text-center">{cooldown > 0 ? `Wait ${cooldown}s` : 'Refresh News'}</span>
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="ml-4 text-gray-600 dark:text-gray-400">Fetching latest articles...</p>
                </div>
            )}

            {error && (
                <div className="text-center bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article, index) => (
                        <ArticleCard key={index} article={article} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default Articles;