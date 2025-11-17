
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, Modality } from '@google/genai';
import { speak } from '../lib/audio';
import { AbstractHorseLogo, BookmarkIcon, CloseIcon, SendIcon, MicrophoneIcon, PaperclipIcon, StopIcon, VolumeUpIcon, SearchIcon } from './icons';

type GroundingChunk = {
    web: { uri?: string; title: string };
};

type Message = {
    id: string;
    role: 'user' | 'model';
    content: string;
    file?: { name: string; mimeType: string };
    citations?: GroundingChunk[];
};

type VoiceOption = { name: string; model: string; };

const voices: VoiceOption[] = [
    { name: 'Kore (Female)', model: 'Kore' },
    { name: 'Puck (Male)', model: 'Puck' },
    { name: 'Charon (Male)', model: 'Charon' },
    { name: 'Zephyr (Female)', model: 'Zephyr' },
];

const CHAT_HISTORY_KEY = 'aiCompanionChatHistory';
const NOTES_KEY = 'aiCompanionNotes';

interface AIChatCompanionProps {
  initialPrompt?: string;
}

const AIChatCompanion: React.FC<AIChatCompanionProps> = ({ initialPrompt }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [notes, setNotes] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; mimeType: string; data: string } | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(voices[0]);

    const chatRef = useRef<Chat | null>(null);
    const streamController = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const inputValueRef = useRef(inputValue);
    const [speechError, setSpeechError] = useState<string | null>(null);

    useEffect(() => {
        inputValueRef.current = inputValue;
    }, [inputValue]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(scrollToBottom, [messages, isLoading]);

     useEffect(() => {
        if (speechError) {
            const timer = setTimeout(() => setSpeechError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [speechError]);

    // Enhanced Speech Recognition Setup
    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = true;

        let initialTranscript = '';

        recognition.onstart = () => {
            initialTranscript = inputValueRef.current;
            setIsListening(true);
            setSpeechError(null);
        };

        // FIX: Replaced SpeechRecognitionEvent with any to resolve TypeScript error.
        recognition.onresult = (event: any) => {
            const sessionTranscript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            const separator = initialTranscript.trim() ? ' ' : '';
            setInputValue(initialTranscript + separator + sessionTranscript);
        };

        // FIX: Replaced SpeechRecognitionErrorEvent with any to resolve TypeScript error.
        recognition.onerror = (event: any) => {
            console.error('Speech Recognition Error:', event.error);
            let errorMessage = `An error occurred: ${event.error}`;
            if (event.error === 'network') {
                errorMessage = 'Network issue. Please check your connection and try again.';
            } else if (event.error === 'audio-capture') {
                errorMessage = 'Microphone not found. Please check connection and permissions.';
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessage = 'Microphone access denied. Please enable it in browser settings.';
            }
            setSpeechError(errorMessage);
            setIsListening(false); // Ensure UI state is reset
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Load chat history and notes from local storage on mount
    useEffect(() => {
        try {
            const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
            if (storedMessages && storedMessages.length > 2) {
                setMessages(JSON.parse(storedMessages));
            } else {
                setMessages([
                    { id: '1', role: 'model', content: "Hello! I'm your AI racing companion. Ask me anything about upcoming races, or upload a document for analysis." },
                ]);
            }
            const storedNotes = localStorage.getItem(NOTES_KEY);
            if(storedNotes) {
                setNotes(JSON.parse(storedNotes));
            }
        } catch (error) {
            console.error("Failed to load data from storage:", error);
        }
    }, []);

    // Save chat history to local storage on change
    useEffect(() => {
        try {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        } catch (error) { console.error("Failed to save chat history:", error); }
    }, [messages]);

    // Save notes to local storage on change
    useEffect(() => {
        try {
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        } catch (error) { console.error("Failed to save notes:", error); }
    }, [notes]);
    
    useEffect(() => {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are an expert horse racing analyst and AI companion. Your goal is to provide insightful, data-driven analysis to help users make informed decisions.
- When asked for analysis, use your Google Search tool to find the latest information from reputable sources (like racing.com, oddschecker, official club sites). Always cite your sources.
- When a user uploads a race form (PDF), you must prioritize information from that document in your analysis.
- Be objective and present pros and cons for contenders. Do not give direct betting advice.
- Keep your tone professional, analytical, and helpful.`;
        
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: systemInstruction,
            },
        });
    }, []);
    
    const handleSendMessage = useCallback(async (textToSend: string, fileToSend: typeof attachedFile) => {
        if (!textToSend.trim() && !fileToSend) return;

        handleStopGeneration();
        streamController.current = new AbortController();

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend, file: fileToSend ? { name: fileToSend.name, mimeType: fileToSend.mimeType } : undefined };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (!chatRef.current) throw new Error("Chat not initialized.");

            const messageParts = [];
            if (fileToSend) { messageParts.push({ inlineData: { mimeType: fileToSend.mimeType, data: fileToSend.data } }); }
            messageParts.push({ text: textToSend });
            
            const stream = await chatRef.current.sendMessageStream({ message: messageParts });

            let fullResponse = '';
            let currentCitations: GroundingChunk[] = [];
            const modelMessageId = Date.now().toString();
            setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '', citations: [] }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                fullResponse += chunkText;
                const newCitations = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web) as GroundingChunk[] || [];
                currentCitations = [...currentCitations, ...newCitations];

                setMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, content: fullResponse, citations: currentCitations } : m));
            }

            if(fullResponse) { speak(fullResponse, selectedVoice.model); }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error(error);
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
            }
        } finally {
            setIsLoading(false);
            streamController.current = null;
        }
    }, [selectedVoice.model]);

    // Handle initial prompt from dashboard
    useEffect(() => {
      if(initialPrompt) {
        setInputValue(initialPrompt);
        // Automatically send the message for a seamless workflow
        handleSendMessage(initialPrompt, null);
      }
    }, [initialPrompt, handleSendMessage]);


    const handleStopGeneration = () => {
        if (streamController.current) {
            streamController.current.abort();
            streamController.current = null;
            setIsLoading(false);
        }
    };
    
    const handleSendClick = () => {
      handleSendMessage(inputValue, attachedFile);
      setInputValue('');
      setAttachedFile(null);
    };

    const handleSearchClick = () => {
      if (!inputValue.trim()) return;
      const searchText = `Using your Google Search tool, find the most up-to-date information about: "${inputValue}"`;
      handleSendMessage(searchText, null);
    };

    const handleVoiceInput = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (readEvent) => {
                const base64Data = (readEvent.target?.result as string).split(',')[1];
                setAttachedFile({ name: file.name, mimeType: file.type, data: base64Data });
            };
            reader.readAsDataURL(file);
        } else { alert('Please select a PDF file.'); }
        e.target.value = '';
    };
    
    const saveNote = (message: Message) => {
        if (!notes.find(note => note.id === message.id)) {
            setNotes(prev => [...prev, message]);
        }
    };

    const deleteNote = (noteId: string) => {
        setNotes(prev => prev.filter(note => note.id !== noteId));
    };

    return (
        <section className="py-16 md:py-24">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">AI Racing Companion</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Your dedicated workspace for real-time analysis and insights.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[70vh] min-h-[600px]">
                {/* Chat Column */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                        <h3 className="font-bold text-gray-900 dark:text-white">Conversation</h3>
                        <div className='flex items-center gap-2'>
                           <select value={selectedVoice.model} onChange={(e) => setSelectedVoice(voices.find(v => v.model === e.target.value) || voices[0])} className="bg-gray-100 dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                               {voices.map(v => <option key={v.model} value={v.model}>{v.name}</option>)}
                           </select>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'items-end'}`}>
                                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><AbstractHorseLogo className="w-5 h-5 text-gray-800 dark:text-white" /></div>}
                                    <div>
                                        <div className={`relative group p-3 rounded-lg max-w-full text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-[#21262D] text-gray-700 dark:text-gray-300 rounded-bl-none'}`}>
                                            {msg.role === 'model' && msg.content && (
                                                <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => speak(msg.content, selectedVoice.model)} className='text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1'><VolumeUpIcon className='w-4 h-4' /></button>
                                                    <button onClick={() => saveNote(msg)} className='text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1'><BookmarkIcon className='w-4 h-4' /></button>
                                                </div>
                                            )}
                                            {msg.file && <div className="mb-2 p-2 bg-black/10 dark:bg-black/20 rounded-md text-xs border border-gray-300 dark:border-gray-600">File attached: <strong>{msg.file.name}</strong></div>}
                                            <p className="whitespace-pre-wrap" style={{ overflowWrap: 'break-word' }}>{msg.content || (isLoading && msg.role === 'model' ? '' : '...')}</p>
                                        </div>
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div className='mt-2 text-xs text-gray-500 dark:text-gray-500 flex flex-wrap gap-2 items-center'>
                                                <SearchIcon className='w-3 h-3 flex-shrink-0' />
                                                <span className='font-semibold'>Sources:</span>
                                                {msg.citations.map((cite, i) => (cite.web.uri && <a key={i} href={cite.web.uri} target="_blank" rel="noopener noreferrer" className='text-blue-500 dark:text-blue-400 hover:underline truncate' title={cite.web.title}>{cite.web.title}</a>))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && messages[messages.length-1].role === 'user' && (
                                <div className="flex items-start gap-3 items-end">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><AbstractHorseLogo className="w-5 h-5 text-gray-800 dark:text-white" /></div>
                                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-[#21262D] text-gray-700 dark:text-gray-300 rounded-bl-none">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-0"></span>
                                            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-150"></span>
                                            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-300"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                         {speechError && (
                            <div className="text-xs text-red-600 dark:text-red-400 p-2 text-center mb-2">
                                {speechError}
                            </div>
                        )}
                        {attachedFile && <div className="text-xs text-gray-700 dark:text-gray-300 p-2 bg-gray-100 dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 rounded-md mb-2 flex justify-between items-center"><span>PDF: {attachedFile.name}</span><button onClick={() => setAttachedFile(null)} className='text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300'>&times;</button></div>}
                        <div className="flex items-center gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2" aria-label="Attach race form"><PaperclipIcon className="w-5 h-5" /></button>
                            <button onClick={handleVoiceInput} className={`p-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`} aria-label={isListening ? "Stop listening" : "Start listening"}><MicrophoneIcon className="w-5 h-5" /></button>
                            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask for analysis or upload a race form..." className="flex-1 bg-gray-100 dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick() } }} />
                            <button onClick={handleSearchClick} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2" aria-label="Search with Google" disabled={!inputValue.trim()}><SearchIcon className="w-5 h-5" /></button>
                            {isLoading ? ( <button onClick={handleStopGeneration} className="bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 transition-colors" aria-label="Stop generation"><StopIcon className="w-5 h-5" /></button> ) : ( <button onClick={handleSendClick} className="bg-blue-600 text-white rounded-lg p-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors" disabled={!inputValue.trim() && !attachedFile} aria-label="Send message"><SendIcon className="w-5 h-5" /></button> )}
                        </div>
                    </div>
                </div>

                {/* Notes Column */}
                <div className="lg:col-span-1 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                        <h3 className="font-bold text-gray-900 dark:text-white">My Notes</h3>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {notes.length === 0 ? (
                            <div className="text-center text-gray-400 dark:text-gray-500 pt-10">
                                <BookmarkIcon className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">Your saved insights will appear here.</p>
                                <p className="text-xs mt-1">Click the bookmark icon on an AI message to save it.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="bg-gray-100 dark:bg-[#21262D] p-3 rounded-lg text-sm group relative">
                                        <button onClick={() => deleteNote(note.id)} className="absolute top-1 right-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AIChatCompanion;