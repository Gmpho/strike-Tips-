import { GoogleGenAI } from '@google/genai';

// --- Type Definitions ---
// These types define the data structures used throughout the application,
// ensuring type safety and clear contracts for what the API functions return.

export type Horse = {
    id: number;
    name: string;
    jockey: string;
    odds: string;
    form: string;
};

export type Race = {
    id: number;
    day: string; // "Today" or "Tomorrow"
    course: string;
    raceNumber: number;
    startsIn: string;
    trackCondition: string;
    distance: string;
    prize: string;
    horses: Horse[];
};

export type Article = {
    title: string;
    link: string;
    source: string;
    summary: string;
    imageUrl: string;
};

// New types for past results
export type PastHorse = Horse & {
    resultPosition: number; // 1 for 1st, 2 for 2nd, etc.
};

export type PastRace = Omit<Race, 'horses' | 'startsIn' | 'day'> & {
    raceDate: string; // e.g., "Yesterday" or a specific date
    horses: PastHorse[];
};


/**
 * Extracts a JSON object from a string that might contain a markdown code block.
 * The Gemini model sometimes wraps its JSON output in ```json ... ```,
 * and this utility robustly handles that case.
 * @param text The raw text response from the Gemini model.
 * @returns The parsed JSON object, or null if parsing fails.
 */
const extractJsonFromMarkdown = <T>(text: string): T | null => {
    // Regex to find a JSON code block. It captures the content between the fences.
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    // If a match is found, use the captured group; otherwise, assume the whole string is JSON.
    const jsonString = match ? match[1] : text;
    try {
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Original text from model:", text); // Log the problematic text for debugging.
        return null;
    }
};

/**
 * A helper function to initialize the GoogleGenAI client.
 * It centralizes the API key check, throwing an error if it's not configured.
 * @returns An instance of the GoogleGenAI client.
 */
const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Caching Utilities ---
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const getFromCache = <T>(key: string): T | null => {
    try {
        const item = sessionStorage.getItem(key);
        if (!item) return null;
        const cached = JSON.parse(item);
        if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
            sessionStorage.removeItem(key);
            return null;
        }
        return cached.data as T;
    } catch (e) {
        console.error("Failed to read from cache:", e);
        return null;
    }
};

const setInCache = <T>(key: string, data: T) => {
    try {
        const item = {
            data,
            timestamp: Date.now()
        };
        sessionStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        console.error("Failed to write to cache:", e);
    }
};

/**
 * Fetches real-time, upcoming horse races using the Gemini API with Google Search grounding.
 * @param forceRefresh - Bypasses the cache if true.
 * @returns A promise that resolves to an array of Race objects.
 * @throws An error with a user-friendly message if the fetch fails.
 */
export const fetchRealtimeRaces = async (forceRefresh = false): Promise<Race[]> => {
    const cacheKey = 'realtimeRaces';
    if (!forceRefresh) {
        const cachedData = getFromCache<Race[]>(cacheKey);
        if (cachedData) {
            console.log("Serving realtime races from cache.");
            return cachedData;
        }
    }

    try {
        const ai = getAI();
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // This detailed prompt is crucial for guiding the model to return accurate and correctly formatted data.
        const prompt = `
            Your task is to find 4-5 real, upcoming horse races.
            The user's current local time is ${currentTime}.

            **Search Priority:**
            1.  First, search for races starting today AFTER ${currentTime}.
            2.  If you cannot find any more races for today, then search for races scheduled for TOMORROW.
            3.  Prioritize races from the following countries: South Africa, USA, UK, Ireland, Australia, and Hong Kong. Use reputable sources like racingpost.com, attheraces.com, skyracing.com.au, or timeform.com.

            **Output Format:**
            You MUST format your response as a single JSON object inside a markdown code block. Do not write any explanation.

            The JSON must be an array of 'Race' objects with this exact structure:
            - id: a unique number for the race.
            - day: a string, either "Today" or "Tomorrow". This is MANDATORY.
            - course: the name of the racetrack.
            - raceNumber: the number of the race.
            - startsIn: the start time in "HH:MM" format.
            - trackCondition: the current condition of the track (e.g., "Good", "Soft"). If not found, use "N/A".
            - distance: the race distance (e.g., "1m 2f").
            - prize: the prize money (e.g., "£5,000"). If not found, use "N/A".
            - horses: an array of 'Horse' objects for that race.

            Each 'Horse' object must have:
            - id: a unique number for the horse.
            - name: the horse's name.
            - jockey: the jockey's name.
            - odds: the current odds (e.g., "5/1", "EVS"). If not available, use "TBD".
            - form: the horse's recent form (e.g., "1-2-3"). If not available, use "-".

            **CRITICAL RULE:** You MUST return a valid JSON array, even if you can only find a few races or if some details are unavailable. Do not apologize or explain. Just return the data you find in the correct JSON format.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                // This enables Google Search grounding, allowing the model to fetch up-to-date information.
                tools: [{ googleSearch: {} }],
            },
        });

        const races = extractJsonFromMarkdown<Race[]>(response.text);
        if (!races) {
            // This error is specific to the model's output format.
            throw new Error("The AI returned data in an unexpected format. A quick refresh should fix it.");
        }
        setInCache(cacheKey, races); // Cache the new data
        return races;
    } catch (error) {
        console.error("Error fetching realtime races:", error);
        
        const errorString = String(error);
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('429')) {
            throw new Error('The service is experiencing high demand. Please wait a moment and try refreshing again.');
        }

        if (error instanceof Error) {
            // Check for our custom format error
            if (error.message.includes("unexpected format")) {
                throw error;
            }
            // This is likely a network issue from the browser side.
            if (error instanceof TypeError) {
                throw new Error('Network error. Please check your internet connection and try again.');
            }
            // Generic fallback for other API errors (e.g., 500 internal server error, bad API key)
            throw new Error('Could not fetch race data. The AI service may be busy or unavailable. Please try again later.');
        }

        // Fallback for non-Error types being thrown
        throw new Error('An unknown error occurred while fetching race data.');
    }
};

/**
 * Fetches recent horse racing news articles using the Gemini API with Google Search grounding.
 * @param forceRefresh - Bypasses the cache if true.
 * @returns A promise that resolves to an array of Article objects.
 * @throws An error with a user-friendly message if the fetch fails.
 */
export const fetchRacingArticles = async (forceRefresh = false): Promise<Article[]> => {
    const cacheKey = 'racingArticles';
    if (!forceRefresh) {
        const cachedData = getFromCache<Article[]>(cacheKey);
        if (cachedData) {
            console.log("Serving racing articles from cache.");
            return cachedData;
        }
    }

    try {
        const ai = getAI();
        const prompt = `
            Fetch 6 recent, high-quality news articles strictly about horse racing.
            It is critical to follow these rules:
            1.  **Topic Focus**: The articles MUST be about horse racing ONLY. Do NOT include articles about other sports, politics, music, or any unrelated topics.
            2.  **Source Diversity**: The articles must come from at least 3 different reputable sources (e.g., BloodHorse, Racing Post, TDN, Paulick Report). Do not use the same source for all articles.
            3.  **Mandatory Images**: For EVERY article, you MUST provide a valid, publicly accessible, high-quality image URL ('imageUrl'). This field cannot be null or empty. If the source article does not have a suitable image, you MUST use your search tool to find a relevant one.
            4.  **Output Format**: Return the data ONLY as a JSON object inside a markdown code block. The JSON must be an array of "Article" objects.
            
            Each "Article" object must have the following properties:
            - title (string): The headline of the article.
            - link (string): The direct URL to the article.
            - source (string): The name of the news publication.
            - summary (string): A brief, one-sentence summary of the article.
            - imageUrl (string): A direct URL to a relevant, high-quality image for the article. This is mandatory.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                // Enable Google Search to find recent articles.
                tools: [{ googleSearch: {} }],
            },
        });

        const articles = extractJsonFromMarkdown<Article[]>(response.text);
        if (!articles) {
            throw new Error("The AI returned news in an unexpected format. A quick refresh should fix it.");
        }
        setInCache(cacheKey, articles); // Cache the new data
        return articles;
    } catch (error) {
        console.error("Error fetching racing articles:", error);

        const errorString = String(error);
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('429')) {
            throw new Error('The service is experiencing high demand. Please wait a moment and try refreshing again.');
        }

        if (error instanceof Error) {
            // Check for our custom format error
            if (error.message.includes("unexpected format")) {
                throw error;
            }
            // This is likely a network issue from the browser side.
            if (error instanceof TypeError) {
                throw new Error('Network error. Please check your internet connection and try again.');
            }
            // Generic fallback for other API errors (e.g., 500 internal server error, bad API key)
            throw new Error('Could not fetch racing news. The AI service may be busy or unavailable. Please try again later.');
        }
        
        throw new Error('An unknown error occurred while fetching articles.');
    }
};


/**
 * Fetches past horse race results using the Gemini API with Google Search grounding.
 * @param forceRefresh - Bypasses the cache if true.
 * @returns A promise that resolves to an array of PastRace objects.
 * @throws An error with a user-friendly message if the fetch fails.
 */
export const fetchPastRaces = async (forceRefresh = false): Promise<PastRace[]> => {
    const cacheKey = 'pastRaces';
    if (!forceRefresh) {
        const cachedData = getFromCache<PastRace[]>(cacheKey);
        if (cachedData) {
            console.log("Serving past races from cache.");
            return cachedData;
        }
    }

    try {
        const ai = getAI();
        const prompt = `
            Your task is to find the results for 4-5 real horse races that finished yesterday.

            **Search Priority:**
            1.  Find completed races from YESTERDAY.
            2.  Prioritize major races from the following countries: South Africa, USA, UK, Ireland, Australia, and Hong Kong. Use reputable sources like racingpost.com, attheraces.com, skyracing.com.au, or timeform.com to find official results.

            **Output Format:**
            You MUST format your response as a single JSON object inside a markdown code block. Do not write any explanation.

            The JSON must be an array of 'PastRace' objects with this exact structure:
            - id: a unique number for the race.
            - raceDate: a string, always "Yesterday".
            - course: the name of the racetrack.
            - raceNumber: the number of the race.
            - trackCondition: the condition of the track at the time of the race. If not found, use "N/A".
            - distance: the race distance.
            - prize: the prize money. If not found, use "N/A".
            - horses: an array of 'PastHorse' objects for that race.

            Each 'PastHorse' object must have:
            - id: a unique number for the horse.
            - name: the horse's name.
            - jockey: the jockey's name.
            - odds: the starting price (SP) odds (e.g., "5/1", "EVS"). If not available, use "TBD".
            - form: the horse's form leading into the race. If not available, use "-".
            - resultPosition: an integer representing the horse's final finishing position (1 for 1st, 2 for 2nd, etc.). This is MANDATORY.

            **CRITICAL RULE:** You MUST return a valid JSON array. Do not apologize or explain. Just return the data you find in the correct JSON format. Find at least 15-20 horses in total across all races.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const pastRaces = extractJsonFromMarkdown<PastRace[]>(response.text);
        if (!pastRaces) {
            throw new Error("The AI returned past results in an unexpected format. A quick refresh should fix it.");
        }
        setInCache(cacheKey, pastRaces); // Cache the new data
        return pastRaces;
    } catch (error) {
        console.error("Error fetching past races:", error);
        
        const errorString = String(error);
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('429')) {
            throw new Error('The service is experiencing high demand. Please wait a moment and try refreshing again.');
        }

        if (error instanceof Error) {
            // Check for our custom format error
            if (error.message.includes("unexpected format")) {
                throw error;
            }
            // This is likely a network issue from the browser side.
            if (error instanceof TypeError) {
                throw new Error('Network error. Please check your internet connection and try again.');
            }
            // Generic fallback for other API errors (e.g., 500 internal server error, bad API key)
            throw new Error('Could not fetch past race data. The AI service may be busy or unavailable. Please try again later.');
        }
        
        throw new Error('An unknown error occurred while fetching past race data.');
    }
};