
import { GoogleGenAI } from '@google/genai';

// Define the types for our data structures
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

const extractJsonFromMarkdown = <T>(text: string): T | null => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = match ? match[1] : text;
    try {
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Original text from model:", text);
        return null;
    }
};

const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fetchRealtimeRaces = async (): Promise<Race[]> => {
    const ai = getAI();
    const now = new Date();
    // Get time in HH:MM format
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
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
            tools: [{ googleSearch: {} }],
        },
    });

    const races = extractJsonFromMarkdown<Race[]>(response.text);
    if (!races) {
        throw new Error("AI failed to return valid JSON for races.");
    }
    return races;
};


export const fetchRacingArticles = async (): Promise<Article[]> => {
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
            tools: [{ googleSearch: {} }],
        },
    });

    const articles = extractJsonFromMarkdown<Article[]>(response.text);
    if (!articles) {
        throw new Error("AI failed to return valid JSON for articles.");
    }
    return articles;
};
