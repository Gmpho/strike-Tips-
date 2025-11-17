import { GoogleGenAI, Modality } from '@google/genai';

// --- Audio Decoding Helpers ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
let currentSpeechSource: AudioBufferSourceNode | null = null;

// Function to ensure AudioContext is running, as browsers may suspend it.
const ensureAudioContextRunning = async () => {
    if (outputAudioContext.state === 'suspended') {
        await outputAudioContext.resume();
    }
};

export async function speak(text: string, voiceName: string = 'Kore'): Promise<void> {
  try {
    await ensureAudioContextRunning();

    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
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
        
        // Stop any currently playing speech RIGHT BEFORE playing the new one.
        // This is the critical fix for the race condition.
        if (currentSpeechSource) {
            currentSpeechSource.stop();
            currentSpeechSource.disconnect();
        }

        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();

        currentSpeechSource = source;

        // When the sound finishes playing, clear the reference.
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
