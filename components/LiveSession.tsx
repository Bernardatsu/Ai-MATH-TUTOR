
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, MicOff, Signal } from 'lucide-react';
import { getLiveClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';

interface LiveSessionProps {
  onBack: () => void;
}

// Helper for PCM encoding
function encodePCM(bytes: Float32Array) {
  const l = bytes.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = bytes[i] * 32768;
  }
  
  let binary = '';
  const len = int16.buffer.byteLength;
  const uint8 = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

// Helper for Audio Decoding
function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onBack }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0); // For visualizer
  const [status, setStatus] = useState("Connecting...");

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!mounted) return;

        const ai = getLiveClient();
        
        // Initialize Audio Contexts
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputContext = new AudioContextClass({ sampleRate: 16000 });
        const outputContext = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = outputContext;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: "You are a friendly, patient, and encouraging math tutor. Listen to the student's questions and help them solve math problems step-by-step. Keep your responses concise and conversational."
          },
          callbacks: {
            onopen: () => {
              console.log("Session opened");
              setIsConnected(true);
              setStatus("Listening...");
              
              // Setup Audio Input Stream
              const source = inputContext.createMediaStreamSource(stream);
              inputSourceRef.current = source;
              
              const processor = inputContext.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;
              
              processor.onaudioprocess = (e) => {
                if (isMuted) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Visualizer logic (simple volume meter)
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(Math.min(rms * 5, 1)); // Scale for visual

                const base64Data = encodePCM(inputData);
                
                sessionPromise.then((session: any) => {
                  sessionRef.current = session;
                  session.sendRealtimeInput({
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  });
                });
              };

              source.connect(processor);
              processor.connect(inputContext.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                 const ctx = outputContext;
                 const audioData = decodeAudio(base64Audio);
                 
                 // Decode
                 const dataInt16 = new Int16Array(audioData.buffer);
                 const frameCount = dataInt16.length;
                 const buffer = ctx.createBuffer(1, frameCount, 24000);
                 const channelData = buffer.getChannelData(0);
                 for (let i = 0; i < frameCount; i++) {
                    channelData[i] = dataInt16[i] / 32768.0;
                 }

                 const source = ctx.createBufferSource();
                 source.buffer = buffer;
                 source.connect(ctx.destination);
                 
                 const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
                 source.start(startTime);
                 nextStartTimeRef.current = startTime + buffer.duration;
                 
                 sourcesRef.current.add(source);
                 source.onended = () => sourcesRef.current.delete(source);
              }
              
              if (msg.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              console.log("Session closed");
              setIsConnected(false);
              setStatus("Disconnected");
            },
            onerror: (err: any) => {
              console.error("Session error", err);
              setStatus("Error connecting");
            }
          }
        });

      } catch (err) {
        console.error("Failed to start live session", err);
        setStatus("Microphone Access Denied");
      }
    };

    startSession();

    return () => {
      mounted = false;
      // Cleanup
      if (inputSourceRef.current) inputSourceRef.current.disconnect();
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (sessionRef.current) sessionRef.current.close();
    };
  }, []); // Empty dependency array (run once)

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] items-center justify-center bg-slate-900 text-white rounded-3xl overflow-hidden relative animate-fade-in mx-4 my-4">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          End Session
        </button>
        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-bold text-green-100 uppercase tracking-wide">Live</span>
        </div>
      </div>

      {/* Visualizer Center */}
      <div className="relative flex flex-col items-center justify-center space-y-12">
        
        <div className="relative">
          {/* Outer Glow */}
          <div 
             className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-30 transition-all duration-100"
             style={{ transform: `scale(${1 + volume * 2})` }}
          ></div>
          
          {/* Main Orb */}
          <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-2xl flex items-center justify-center relative z-10 overflow-hidden">
             {/* Dynamic Inner Waves */}
             <div className="absolute inset-0 opacity-40">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
             </div>
             <Signal className="w-16 h-16 text-white opacity-80" />
          </div>

          {/* User Voice Indicator */}
          <div 
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1 items-end h-8"
          >
             {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-white rounded-full transition-all duration-75"
                  style={{ 
                    height: `${Math.max(4, Math.random() * volume * 40)}px`,
                    opacity: isMuted ? 0.2 : 0.8
                  }}
                ></div>
             ))}
          </div>
        </div>

        <div className="text-center space-y-2">
           <h2 className="text-2xl font-bold">{status}</h2>
           <p className="text-slate-400 max-w-sm">
             Speak naturally. I'm listening and ready to help with any math problem.
           </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 flex gap-6 z-10">
        <button
          onClick={toggleMute}
          className={`p-6 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

    </div>
  );
};
