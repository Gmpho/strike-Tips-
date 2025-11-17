import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Removed `LiveSession` as it is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { AbstractHorseLogo, MicrophoneIcon, StopIcon } from './icons';
import { View } from '../App';

/**
 * --- Audio Encoding/Decoding Helpers ---
 * These functions are critical for handling the raw PCM audio data required by the Gemini Live API.
 * The browser's native audio APIs work with different formats, so we must manually encode/decode.
 */

/**
 * Encodes a Uint8Array of raw audio data into a Base64 string.
 * @param bytes The raw audio data.
 * @returns A Base64 encoded string.
 */
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a Uint8Array of raw audio data.
 * @param base64 The Base64 encoded audio string from the API.
 * @returns A Uint8Array of raw audio data.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that the Web Audio API can play.
 * @param data The raw PCM audio data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini's output).
 * @param numChannels The number of audio channels (typically 1 for mono).
 * @returns A promise that resolves to an AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is 16-bit signed integers.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit integer to a float between -1.0 and 1.0.
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Constants for the audio sample rates. Must match what the model expects/provides.
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const TRANSCRIPTION_HISTORY_KEY = 'jarvisTranscriptionHistory';

type Transcript = {
    id: string;
    role: 'user' | 'model';
    text: string;
};

interface AIChatCompanionProps {
    navigateTo: (view: View) => void;
    onRefreshData: () => void;
}

// Defines the 'refresh_race_data' function that the AI model can call.
const refreshDataFunctionDeclaration: FunctionDeclaration = {
    name: 'refresh_race_data',
    description: 'Refreshes the horse racing data on the main dashboard if the user asks for it.',
    parameters: { type: Type.OBJECT, properties: {} }
};

/**
 * The AI Chat Companion component, providing a real-time, voice-native conversational experience.
 * This is the most complex component in the application, managing:
 * - Microphone access and audio processing.
 * - A persistent WebSocket connection to the Gemini Live API.
 * - Bidirectional streaming of audio data.
 * - Real-time transcription display.
 * - Handling of function calls from the AI model.
 * - Graceful cleanup of all resources ( VERY important to prevent memory/resource leaks).
 */
const AIChatCompanion: React.FC<AIChatCompanionProps> = ({ navigateTo, onRefreshData }) => {
    // Component state
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for managing and displaying the conversation transcript
    const [transcriptionHistory, setTranscriptionHistory] = useState<Transcript[]>([]);
    const [currentUserTranscription, setCurrentUserTranscription] = useState('');
    const [currentModelTranscription, setCurrentModelTranscription] = useState('');
    const [micVolume, setMicVolume] = useState(0);

    // Refs are used to hold onto mutable objects across re-renders without causing them.
    // This is essential for managing Web Audio API nodes, media streams, and the session promise.
    // FIX: Replaced `LiveSession` with `any` as `LiveSession` is not exported from the library.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const playingAudioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    // Ref to track the next start time for audio playback, ensuring gapless audio.
    const nextAudioStartTime = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Refs for the microphone volume visualization
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameId = useRef<number | null>(null);


    // Effect to load transcription history from localStorage on component mount.
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(TRANSCRIPTION_HISTORY_KEY);
            if (storedHistory) {
                setTranscriptionHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to load transcription history:", e);
        }
    }, []);

    // Effect to save transcription history to localStorage whenever it changes.
    useEffect(() => {
        try {
            localStorage.setItem(TRANSCRIPTION_HISTORY_KEY, JSON.stringify(transcriptionHistory));
        } catch (e) {
            console.error("Failed to save transcription history:", e);
        }
    }, [transcriptionHistory]);

    // Effect to auto-scroll the chat window to the bottom on new messages.
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [transcriptionHistory, currentUserTranscription, currentModelTranscription]);

    /**
     * A memoized callback for visualizing microphone input volume.
     * Uses an AnalyserNode to get audio data and calculates the RMS volume.
     */
    const visualize = useCallback(() => {
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
            let sumSquares = 0.0;
            for (const amplitude of dataArrayRef.current) {
                const normalized = (amplitude / 128.0) - 1.0; // Convert byte to -1.0 to 1.0
                sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / dataArrayRef.current.length);
            // Scale RMS for better visual effect and clamp the value
            setMicVolume(Math.min(1, rms * 5)); 
        }
        animationFrameId.current = requestAnimationFrame(visualize);
    }, []);

    /**
     * A critical, memoized cleanup function.
     * This function is responsible for tearing down all active resources to prevent leaks.
     * This includes stopping audio playback, disconnecting all Web Audio nodes,
     * closing AudioContexts, and stopping microphone tracks.
     */
    const cleanup = useCallback(() => {
        console.log('Cleaning up resources...');
        isLive && setIsLive(false);
        isConnecting && setIsConnecting(false);

        // Stop the visualization animation loop.
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        setMicVolume(0);
        
        // Stop any audio that is currently playing from the model.
        playingAudioSources.current.forEach(source => source.stop());
        playingAudioSources.current.clear();

        // Disconnect the audio processing graph to stop mic input processing.
        analyserRef.current?.disconnect();
        analyserRef.current = null;
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;

        // Close the audio contexts to release system resources.
        inputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        outputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current = null;

        // Stop the microphone track to turn off the mic indicator in the browser.
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        // Clear the session promise ref.
        sessionPromiseRef.current = null;
    }, [isLive, isConnecting]);

    /**
     * A handler to explicitly disconnect the session and trigger cleanup.
     */
    const handleDisconnect = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.close(); // Gracefully close the WebSocket connection.
                console.log("Session closed.");
            }).catch(console.error);
        }
        cleanup();
    }, [cleanup]);

    // Ensure cleanup is called when the component is unmounted.
    useEffect(() => {
        return () => handleDisconnect();
    }, [handleDisconnect]);

    /**
     * The main function to initiate a connection to the Gemini Live API.
     */
    const handleConnect = async () => {
        if (isLive || isConnecting) return;
        setIsConnecting(true);
        setError(null);

        try {
            // Prerequisite checks
            if (!process.env.API_KEY) {
                throw new Error("A configuration error occurred. Please contact support.");
            }

            try {
                // Request microphone permissions from the user.
                mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
                 console.error("Microphone access denied:", err);
                 throw new Error("Microphone access denied. Please allow it in your browser settings and try again.");
            }

            // Initialize AudioContexts.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
            
            // Browsers often suspend AudioContexts until a user gesture. We must resume them.
            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // The system instruction sets the persona and rules for the AI model.
            const systemInstruction = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), but with a specialization in global horse racing analytics.
- Your persona is professional, witty, incredibly helpful, and slightly playful.
- You are speaking to a user who is passionate about horse racing. Your goal is to be their ultimate AI companion.
- Engage in natural, fluid conversation. Do not use markdown, headings, or lists. Speak your analysis as if you were a world-class pundit.
- Provide real-time data, predictive insights, and deep analysis of races, horses, jockeys, and track conditions.
- You can also discuss other topics, but always maintain your core J.A.R.V.I.S. persona.`;

            // `ai.live.connect` establishes the WebSocket connection.
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction,
                    responseModalities: [Modality.AUDIO], // We want audio responses.
                    inputAudioTranscription: {}, // Enable transcription of user's speech.
                    outputAudioTranscription: {}, // Enable transcription of model's speech.
                    tools: [{ functionDeclarations: [refreshDataFunctionDeclaration] }], // Provide functions the AI can call.
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } // A good J.A.R.V.I.S.-like voice
                },
                // Callbacks to handle events from the server.
                callbacks: {
                    onopen: () => {
                        console.log('Session opened.');
                        setIsConnecting(false);
                        setIsLive(true);

                        if (!mediaStreamRef.current || !inputAudioContextRef.current) return;
                        
                        // --- Setup Web Audio API Graph for Mic Input ---
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        // Setup for visualization
                        analyserRef.current = inputAudioContextRef.current.createAnalyser();
                        analyserRef.current.fftSize = 256;
                        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

                        // Connect the graph: source -> analyser -> scriptProcessor -> destination (speakers, for monitoring if needed)
                        mediaStreamSourceRef.current.connect(analyserRef.current);
                        analyserRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

                        // This event fires whenever the script processor buffer is full.
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            
                            // Convert the Float32Array to 16-bit PCM data.
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }

                            // Create the Blob object the API expects.
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };

                            // CRITICAL: Send data only after the session promise resolves.
                            // This prevents a race condition where we try to send data before the connection is fully established.
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        
                        // Start the visualization animation loop.
                        visualize();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         // --- Handle Function Calls from the Model ---
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'refresh_race_data') {
                                    console.log('Function call received: refresh_race_data');
                                    onRefreshData(); // Trigger the data refresh in the parent component.
    
                                    // CRITICAL: We must send a response back to the model to inform it the function was executed.
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id : fc.id,
                                                name: fc.name,
                                                response: { result: "Done. I've refreshed the race data. Taking you to the dashboard now." },
                                            }
                                        })
                                    });

                                    // Navigate AFTER a delay to allow the AI's audio response to play fully.
                                    setTimeout(() => {
                                        navigateTo('dashboard');
                                    }, 5000);
                                }
                            }
                        }

                        // --- Handle Live Transcriptions ---
                        let userText = '';
                        let modelText = '';

                        if (message.serverContent?.inputTranscription) {
                            userText = message.serverContent.inputTranscription.text;
                            setCurrentUserTranscription(prev => prev + userText);
                        }
                        if (message.serverContent?.outputTranscription) {
                            modelText = message.serverContent.outputTranscription.text;
                            setCurrentModelTranscription(prev => prev + modelText);
                        }

                        // When a full "turn" (user speech + model response) is complete,
                        // commit the interim transcriptions to the permanent history.
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentUserTranscription + userText;
                            const fullOutput = currentModelTranscription + modelText;
                            if (fullInput.trim()) {
                                setTranscriptionHistory(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text: fullInput.trim() }]);
                            }
                            if (fullOutput.trim()) {
                                setTranscriptionHistory(prev => [...prev, { id: `model-${Date.now()}`, role: 'model', text: fullOutput.trim() }]);
                            }
                            setCurrentUserTranscription('');
                            setCurrentModelTranscription('');
                        }

                        // --- Handle Audio Output from the Model ---
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            // Schedule the next audio chunk to play immediately after the previous one finishes.
                            nextAudioStartTime.current = Math.max(nextAudioStartTime.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, OUTPUT_SAMPLE_RATE, 1);
                            
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => {
                                playingAudioSources.current.delete(source);
                            });

                            source.start(nextAudioStartTime.current);
                            nextAudioStartTime.current += audioBuffer.duration;
                            playingAudioSources.current.add(source);
                        }
                        
                        // If the model's speech is interrupted (e.g., by the user speaking), stop all playback.
                        if (message.serverContent?.interrupted) {
                            playingAudioSources.current.forEach(source => source.stop());
                            playingAudioSources.current.clear();
                            nextAudioStartTime.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError(`Connection to J.A.R.V.I.S. lost. Please check your network and try again.`);
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Session closed:', e);
                        cleanup();
                    }
                }
            });
        } catch (err: any) {
            console.error("Failed to connect:", err);
            setError(err.message || "An unknown error occurred. Please check your connection and try again.");
            setIsConnecting(false);
            cleanup();
        }
    };

    /**
     * Clears the transcription history from state and localStorage.
     */
    const handleClearHistory = () => {
        setTranscriptionHistory([]);
        setCurrentUserTranscription('');
        setCurrentModelTranscription('');
        try {
            localStorage.removeItem(TRANSCRIPTION_HISTORY_KEY);
        } catch (e) {
            console.error("Failed to clear history from storage:", e);
        }
    };

    const renderTranscript = (transcript: Transcript) => (
        <div key={transcript.id} className={`flex gap-3 my-4 ${transcript.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {transcript.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                    <AbstractHorseLogo className="w-5 h-5 text-white" />
                </div>
            )}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${transcript.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'}`}>
                <p className="text-sm">{transcript.text}</p>
            </div>
        </div>
    );
    
    return (
        <section className="py-16 md:py-24">
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-8 relative">
                    <div className="inline-flex items-center justify-center gap-2">
                        <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">J.A.R.V.I.S. AI Companion</h2>
                        {/* Tooltip explaining available voice commands */}
                        <div className="relative group flex items-center">
                            {/* FIX: Removed duplicate attributes from SVG element */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 dark:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded-lg py-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 left-1/2 -translate-x-1/2">
                                <p className="font-bold mb-1">Try saying:</p>
                                <p>"Refresh the race data for me."</p>
                                <p className="text-gray-400 text-[10px] mt-1">(This will update and navigate to the dashboard)</p>
                                <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Your personal, voice-native horse racing analyst. Ask anything.</p>
                     {transcriptionHistory.length > 0 && (
                        <button 
                            onClick={handleClearHistory}
                            className="absolute top-0 right-0 text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            aria-label="Clear chat history"
                        >
                            Clear History
                        </button>
                    )}
                </header>
                
                {/* Chat window */}
                <div className="h-[50vh] bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col shadow-lg">
                    <div className="flex-1 p-4 overflow-y-auto">
                         {transcriptionHistory.length === 0 && !isLive && !isConnecting && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                <AbstractHorseLogo className="w-16 h-16 mb-4"/>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Conversation is empty</h3>
                                <p className="text-sm">Click "Start Conversation" below to begin.</p>
                            </div>
                         )}
                        {transcriptionHistory.map(renderTranscript)}
                        
                        {/* Live Transcriptions rendered with a pulse effect to indicate they are interim */}
                        {currentUserTranscription && (
                            <div className="flex gap-3 my-4 justify-end">
                                <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg bg-blue-600/70 text-white/80 animate-pulse">
                                    <p className="text-sm">{currentUserTranscription}</p>
                                </div>
                            </div>
                        )}
                        {currentModelTranscription && (
                             <div className="flex gap-3 my-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                                    <AbstractHorseLogo className="w-5 h-5 text-white" />
                                </div>
                                <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg bg-gray-200/70 dark:bg-gray-700/70 text-gray-900/80 dark:text-gray-200/80 animate-pulse">
                                    <p className="text-sm">{currentModelTranscription}</p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Action bar with connection controls */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        {error && (
                            <div className="text-center bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between" role="alert">
                                <span>{error}</span>
                                <button
                                    onClick={handleConnect}
                                    className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-center">
                            {!isLive && !isConnecting && !error && (
                                <button
                                    onClick={handleConnect}
                                    className="flex items-center gap-3 px-6 py-3 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl"
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                    Start Conversation
                                </button>
                            )}
                            {isConnecting && (
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <span>Connecting to J.A.R.V.I.S...</span>
                                </div>
                            )}
                            {isLive && (
                                <button
                                    onClick={handleDisconnect}
                                    className="flex items-center gap-3 px-6 py-3 text-base font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl"
                                >
                                    <div className="relative h-6 w-6 flex items-center justify-center">
                                        {/* Microphone volume visualization */}
                                        <div 
                                            className="absolute top-0 left-0 w-full h-full bg-white/30 rounded-full -z-10 transition-transform duration-200 ease-out"
                                            style={{ transform: `scale(${1 + micVolume * 1.5})` }}
                                        />
                                        <StopIcon className="w-6 h-6 z-10" />
                                    </div>
                                    End Conversation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AIChatCompanion;