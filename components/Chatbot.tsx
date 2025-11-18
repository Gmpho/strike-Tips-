import React, { useState, useEffect, useRef } from 'react';
// FIX: Import GenerateContentResponse to explicitly type the API response.
import { GoogleGenAI, Chat as GenAIChat, GenerateContentResponse } from '@google/genai';
import { AbstractHorseLogo, TrashIcon } from './icons';
import { Race } from '../lib/gemini';

// Defines the structure of a single chat message.
type Message = {
    role: 'user' | 'model';
    text: string;
};

interface ChatProps {
    raceToAnalyze: Race | null;
    setRaceToAnalyze: (race: Race | null) => void;
}

const initialMessage: Message = { role: 'model', text: "Hello! I'm your friendly horse racing expert. Ask me anything about the sport!" };

/**
 * A text-based chatbot component that allows users to have a conversation
 * with a Gemini model specialized in horse racing knowledge.
 */
const Chat: React.FC<ChatProps> = ({ raceToAnalyze, setRaceToAnalyze }) => {
    // State to hold the active chat session instance from the Gemini API.
    const [chat, setChat] = useState<GenAIChat | null>(null);
    // State to store the history of messages in the current conversation.
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    // State for the user's current input in the text field.
    const [userInput, setUserInput] = useState('');
    // State to track when the model is processing a response.
    const [isLoading, setIsLoading] = useState(false);
    // State to display any errors that occur during the chat session.
    const [error, setError] = useState<string | null>(null);
    // Ref to the end of the messages container, used for auto-scrolling.
    const messagesEndRef = useRef<HTMLDivElement>(null);

    /**
     * Effect to initialize the chat session when the component mounts.
     * It creates a new chat instance with a specific system instruction.
     */
    useEffect(() => {
        const initChat = () => {
            try {
                if (!process.env.API_KEY) {
                    throw new Error("API key not configured.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const chatSession = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        // The system instruction sets the persona and rules for the AI model.
                        systemInstruction: 'You are a friendly and knowledgeable horse racing expert. Answer questions about horse racing history, terminology, famous horses, and betting strategies. Keep your answers concise and easy to understand for beginners. You also provide expert analysis on specific races when asked.',
                    },
                });
                setChat(chatSession);
                // Set initial greeting message if no analysis is pending.
                if (!raceToAnalyze) {
                   setMessages([initialMessage]);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to initialize the chat service.');
                console.error(err);
            }
        };
        initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Effect to handle an incoming race analysis request from the dashboard.
     */
    useEffect(() => {
        if (raceToAnalyze && chat) {
            // Format the race data into a detailed, user-friendly prompt.
            const horseList = raceToAnalyze.horses.map(h => `- ${h.name} (Jockey: ${h.jockey}, Odds: ${(h as any).odds}, Form: ${h.form})`).join('\n');
            const prompt = `Please provide a detailed analysis of the upcoming race at ${raceToAnalyze.course}, race number ${raceToAnalyze.raceNumber}.
The race is on ${raceToAnalyze.day}, starts at ${raceToAnalyze.startsIn}, and is over ${raceToAnalyze.distance} on a track with condition "${raceToAnalyze.trackCondition}".
Here are the horses:
${horseList}

Give me your expert opinion on the top contenders and a potential longshot, explaining your reasoning.`;

            // This function sends the initial message without needing a form event.
            const sendAnalysisRequest = async (initialPrompt: string) => {
                const userMessage: Message = { role: 'user', text: initialPrompt };
                // Prepend the greeting if it's the first message.
                // FIX: Explicitly cast the initial message object to the `Message` type to resolve
                // a type inference issue within the ternary expression.
                const initialMessages = messages.length === 1 && messages[0].text.startsWith("Hello!")
                    ? messages
                    : [initialMessage];
                
                setMessages([...initialMessages, userMessage]);
                setIsLoading(true);
                setError(null);

                try {
                    // FIX: Explicitly type the response to ensure correct type inference.
                    const response: GenerateContentResponse = await chat.sendMessage({ message: userMessage.text });
                    const modelMessage: Message = { role: 'model', text: response.text };
                    setMessages(prev => [...prev, modelMessage]);
                } catch (err) {
                    console.error("Error sending message:", err);
                    setError('Sorry, I encountered an error during analysis. Please try again.');
                    // Roll back the user message on error.
                    setMessages(prev => prev.slice(0, -1));
                } finally {
                    setIsLoading(false);
                    // Clear the raceToAnalyze state to prevent re-triggering on re-renders.
                    setRaceToAnalyze(null);
                }
            };
            
            sendAnalysisRequest(prompt);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raceToAnalyze, chat, setRaceToAnalyze]);


    /**
     * Scrolls the message container to the bottom.
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Trigger auto-scroll whenever the messages array is updated.
    useEffect(scrollToBottom, [messages]);

    /**
     * Handles the submission of a new message from the user.
     * It sends the message to the Gemini API and updates the chat history.
     */
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chat) return;

        // Optimistically add the user's message to the UI.
        const userMessage: Message = { role: 'user', text: userInput.trim() };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Send the message to the model and wait for the response.
            // FIX: Explicitly type the response to ensure correct type inference.
            const response: GenerateContentResponse = await chat.sendMessage({ message: userMessage.text });
            const modelMessage: Message = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error("Error sending message:", err);
            setError('Sorry, I encountered an error. Please try again.');
            // If an error occurs, roll back the optimistic UI update.
            setUserInput(userMessage.text);
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearHistory = () => {
        setMessages([initialMessage]);
    };

    /**
     * Renders a single message bubble.
     * @param message The message object to render.
     * @param index The index of the message in the array.
     */
    const renderMessage = (message: Message, index: number) => (
        <div key={index} className={`flex gap-3 my-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center self-end">
                    <AbstractHorseLogo className="w-5 h-5 text-white" />
                </div>
            )}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 shadow-md ${
                message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-t-2xl rounded-br-2xl'
            }`}>
                {/* Using pre-wrap to preserve newlines from the model's response */}
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
            </div>
        </div>
    );

    return (
        <section className="py-16 md:py-24">
             <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Expert Chat</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Have a text-based conversation with our AI racing expert for analysis and answers.
                </p>
            </div>
            <div className="max-w-3xl mx-auto">
                <div className="h-[70vh] min-h-[500px] max-h-[800px] bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col shadow-2xl shadow-blue-900/10">
                    {/* Card Header */}
                     <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    <AbstractHorseLogo className="w-6 h-6 text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-[#161B22]"></span>
                            </div>
                             <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status: Online</p>
                        </div>
                         <button 
                            onClick={handleClearHistory}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-full"
                            aria-label="Clear chat history"
                            disabled={messages.length <= 1}
                        >
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Message display area */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map(renderMessage)}
                        {/* Loading indicator for when the model is thinking */}
                        {isLoading && (
                             <div className="flex gap-3 my-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center self-end">
                                    <AbstractHorseLogo className="w-5 h-5 text-white" />
                                </div>
                                <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-t-2xl rounded-br-2xl bg-gray-200 dark:bg-gray-700">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* User input area */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        {error && (
                            <p className="text-sm text-red-500 mb-2 text-center">{error}</p>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Ask a question..."
                                disabled={isLoading || !chat}
                                className="flex-1 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !userInput.trim()}
                                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Chat;