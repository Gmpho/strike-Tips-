import { GoogleGenAI, Modality } from '@google/genai';

// --- Audio Decoding Helpers ---
// These functions are necessary to convert the Base64 encoded, raw PCM audio
// data from the Gemini TTS API into a format the browser's Web Audio API can play.

/**
 * Decodes a Base64 string into a Uint8Array.
 * @param base64 The Base64 encoded string.
 * @returns A Uint8Array of the decoded data.
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
 * Decodes raw PCM audio data into a playable AudioBuffer.
 * @param data The raw PCM audio data.
 * @param ctx The AudioContext to use.
 * @param sampleRate The sample rate of the audio (24000 for the TTS model).
 * @param numChannels The number of audio channels (1 for mono).
 * @returns A promise that resolves to an AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Text-to-Speech API Call ---

// A single, global AudioContext is used for all TTS playback to manage resources efficiently.
const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
// A reference to the currently playing audio source. This is crucial for interruption logic.
let currentSpeechSource: AudioBufferSourceNode | null = null;

/**
 * Ensures the global AudioContext is running. Browsers often suspend audio contexts
 * until a user interaction occurs. This function resumes it if necessary.
 */
const ensureAudioContextRunning = async () => {
    if (outputAudioContext.state === 'suspended') {
        await outputAudioContext.resume();
    }
};

/**
 * Converts text to speech using the Gemini TTS model and plays it in the browser.
 * It also handles interrupting any previously playing speech.
 * @param text The text to be spoken.
 * @param voiceName The prebuilt voice to use (e.g., 'Kore').
 */
export async function speak(text: string, voiceName: string = 'Kore'): Promise<void> {
  try {
    await ensureAudioContextRunning();

    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Call the model to generate audio content.
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO], // Specify that we want audio output.
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContext,
            24000,
            1,
        );
        
        // CRITICAL FIX FOR RACE CONDITIONS:
        // Stop any currently playing speech *before* starting the new one.
        // This prevents multiple speech tracks from overlapping if `speak` is called rapidly.
        if (currentSpeechSource) {
            currentSpeechSource.stop();
            currentSpeechSource.disconnect();
        }

        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();

        // Store the new source as the currently playing one.
        currentSpeechSource = source;

        // When the sound finishes playing, clear the reference to allow the next speech to play.
        source.onended = () => {
            if (currentSpeechSource === source) {
                currentSpeechSource = null;
            }
        };

    } else {
        console.warn("No audio data received from TTS API.");
    }
  } catch (error) {
    console.error("Error in text-to-speech:", error);
  }
}