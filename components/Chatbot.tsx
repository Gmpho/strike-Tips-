

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat as GenAIChat } from '@google/genai';
import { AbstractHorseLogo } from './icons';

// Defines the structure of a single chat message.
type Message = {
    role: 'user' | 'model';
    text: string;
};

/**
 * A text-based chatbot component that allows users to have a conversation
 * with a Gemini model specialized in horse racing knowledge.
 */
const Chat: React.FC = () => {
    // State to hold the active chat session instance from the Gemini API.
    const [chat, setChat] = useState<GenAIChat | null>(null);
    // State to store the history of messages in the current conversation.
    const [messages, setMessages] = useState<Message[]>([]);
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
                        systemInstruction: 'You are a friendly and knowledgeable horse racing expert. Answer questions about horse racing history, terminology, famous horses, and betting strategies. Keep your answers concise and easy to understand for beginners. Do not provide real-time tips or predictions.',
                    },
                });
                setChat(chatSession);
                // Add an initial greeting message from the model.
                setMessages([
                    { role: 'model', text: "Hello! I'm your friendly horse racing expert. Ask me anything about the sport!" }
                ]);
            } catch (err: any) {
                setError(err.message || 'Failed to initialize the chat service.');
                console.error(err);
            }
        };
        initChat();
    }, []);

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
            const response = await chat.sendMessage({ message: userMessage.text });
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

    /**
     * Renders a single message bubble.
     * @param message The message object to render.
     * @param index The index of the message in the array.
     */
    const renderMessage = (message: Message, index: number) => (
        <div key={index} className={`flex gap-3 my-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                    <AbstractHorseLogo className="w-5 h-5 text-white" />
                </div>
            )}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'}`}>
                {/* Using pre-wrap to preserve newlines from the model's response */}
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
            </div>
        </div>
    );

    return (
        <section className="py-16 md:py-24">
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-8">
                    <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">AI Chat</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Ask our AI expert about horse racing history, terms, and more.</p>
                </header>
                
                <div className="h-[60vh] bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col shadow-lg">
                    {/* Message display area */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map(renderMessage)}
                        {/* Loading indicator for when the model is thinking */}
                        {isLoading && (
                             <div className="flex gap-3 my-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                                    <AbstractHorseLogo className="w-5 h-5 text-white" />
                                </div>
                                <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
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