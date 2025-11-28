
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Lightbulb,
  Paperclip,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ChevronRight,
  Zap,
  Globe,
  Settings2,
  ExternalLink,
  Volume2,
  Square,
  Bookmark,
  Download,
  Bot,
  User as UserIconCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { solveMathProblem, generateExplanationAudio, createFlashcard, transcribeAudio } from './services/geminiService';
import { HistoryItem, SolveResponse, FileData, SolverMode, PageType, ChatMessage, FlashcardData } from './types';
import { MathRenderer } from './components/MathRenderer';
import { HistorySidebar } from './components/HistorySidebar';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PlaceholderPage } from './components/PlaceholderPage';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { FlashcardModal } from './components/FlashcardModal';
import { AboutPage } from './components/AboutPage';
import { LiveSession } from './components/LiveSession';

// Audio Utility Functions
function decode(base64: string) {
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g. "data:audio/wav;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

// Reusable Copy Button Component
const CopyButton: React.FC<{ text: string; className?: string; iconColor?: string }> = ({ 
  text, 
  className = "", 
  iconColor = "currentColor" 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`group flex items-center gap-1.5 transition-all active:scale-95 ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" strokeWidth={3} />
          <span className="text-xs font-bold">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
          <span className="text-xs font-medium opacity-70 group-hover:opacity-100">Copy</span>
        </>
      )}
    </button>
  );
};

// Bot Message Component
const BotMessage: React.FC<{ 
  message: ChatMessage, 
  onGenerateFlashcard: (q: string, a: string, c: string) => void,
  onPlayAudio: (text: string) => void,
  isPlayingAudio: boolean,
  isLoadingAudio: boolean
}> = ({ message, onGenerateFlashcard, onPlayAudio, isPlayingAudio, isLoadingAudio }) => {
  if (!message.response) return null;
  const result = message.response;

  return (
    <div className="w-full max-w-4xl space-y-6 animate-slide-up pb-8 print-only">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Final Answer Column */}
          <div className="lg:col-span-3">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl shadow-indigo-100 text-white p-6 md:p-8">
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2 flex-wrap justify-end no-print">
                    <button
                      onClick={() => onGenerateFlashcard(message.text, result.answer, result.concept)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all"
                      title="Create Flashcard"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span className="text-xs font-bold hidden sm:inline">Flashcard</span>
                    </button>
                    <button
                      onClick={() => {
                         const textToSpeak = `The answer is ${result.answer}. Here is a summary: ${result.steps.slice(0, 3).join('. ')}`;
                         onPlayAudio(textToSpeak);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border border-white/20 transition-all ${isPlayingAudio ? 'bg-indigo-500/80 text-white shadow-inner' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                      title="Listen to Explanation"
                    >
                       {isLoadingAudio ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : isPlayingAudio ? (
                         <>
                           <Square className="w-4 h-4 fill-white" />
                           <span className="text-xs font-bold hidden sm:inline">Stop</span>
                         </>
                       ) : (
                         <>
                           <Volume2 className="w-4 h-4" />
                           <span className="text-xs font-bold hidden sm:inline">Listen</span>
                         </>
                       )}
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-md border border-white/20 transition-all"
                      title="Print Solution"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <CopyButton 
                      text={result.answer} 
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg backdrop-blur-md border border-white/20 transition-all"
                    />
                  </div>

                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/20 shadow-sm">
                              Final Answer
                          </span>
                          <span className="flex items-center gap-1.5 text-indigo-100 text-xs font-medium px-3 py-1 bg-black/10 rounded-full border border-white/5">
                              <Lightbulb className="w-3 h-3 text-yellow-300" />
                              {result.concept}
                          </span>
                      </div>
                      
                      <div className="text-2xl md:text-3xl font-bold leading-relaxed pr-8">
                          <MathRenderer content={result.answer} className="text-white math-white" />
                      </div>
                  </div>
              </div>
          </div>

          {/* Sources Section (If present) */}
          {result.sources && result.sources.length > 0 && (
             <div className="lg:col-span-3 no-print">
                <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 mb-3">
                    <Globe className="w-4 h-4" />
                    Sources from Google Search
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors text-sm text-slate-600 hover:text-blue-600 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                        <span className="truncate">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
             </div>
          )}

          {/* Steps Column */}
          <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 no-print">
                      <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-100 text-green-700 rounded-lg shadow-sm">
                              <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-slate-800 text-base">Step-by-Step Explanation</h3>
                      </div>
                      
                      <CopyButton 
                        text={result.steps.join('\n')} 
                        className="bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                      />
                  </div>
                  
                  <div className="p-6 space-y-8">
                      {result.steps.map((step, index) => (
                          <div key={index} className="relative pl-10 md:pl-12 group">
                              {/* Vertical Line */}
                              {index !== result.steps.length - 1 && (
                                  <div className="absolute left-[19px] md:left-[21px] top-10 bottom-[-32px] w-0.5 bg-slate-100 group-hover:bg-indigo-50 transition-colors"></div>
                              )}
                              
                              {/* Number Badge */}
                              <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-white border-2 border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm z-10 group-hover:border-indigo-500 group-hover:text-indigo-700 group-hover:shadow-md transition-all duration-300">
                                  {index + 1}
                              </div>
                              
                              {/* Content */}
                              <div className="pt-1.5">
                                  <MathRenderer content={step} className="text-slate-700 text-base leading-relaxed" />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// User Message Component
const UserMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <div className="w-full flex justify-end animate-fade-in no-print">
    <div className="max-w-[85%] sm:max-w-[70%] bg-white border border-slate-200 rounded-2xl rounded-tr-none px-5 py-4 shadow-sm text-slate-800 text-lg relative group">
       <MathRenderer content={message.text} />
       {message.fileData && (
          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-sm text-slate-500">
             <Paperclip className="w-3 h-3" />
             <span className="truncate max-w-[150px]">{message.fileData.name}</span>
          </div>
       )}
       <div className="absolute -right-2 top-0 w-3 h-3 bg-white border-t border-r border-slate-200 transform rotate-45"></div>
    </div>
  </div>
);


const EXAMPLE_PROBLEMS = [
  { label: "Calculus", query: "Teach me how to find the derivative of f(x) = x² * sin(x)" },
  { label: "Algebra", query: "Help me solve for x: 3x² + 4x - 5 = 0" },
  { label: "Search", query: "What is the current population of Tokyo?" },
  { label: "Concept", query: "Explain the Pythagorean Theorem like I'm 5" }
];

const App: React.FC = () => {
  const { user, logout, setShowAuthModal } = useAuth();
  
  // State
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [solverMode, setSolverMode] = useState<SolverMode>('standard');
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Flashcard State
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(null);
  
  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleListening = async () => {
    if (isListening) {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsListening(false);
      }
    } else {
      // START RECORDING
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setIsLoading(true); // Show loading while transcribing
          
          try {
             const base64Audio = await blobToBase64(audioBlob);
             const text = await transcribeAudio(base64Audio);
             setQuestion(prev => prev ? `${prev} ${text}` : text);
          } catch (err) {
             console.error("Transcription failed", err);
             setError("Failed to transcribe audio.");
          } finally {
             setIsLoading(false);
             // Stop all tracks to release microphone
             stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Microphone access denied", err);
        setError("Microphone access denied. Please allow permissions.");
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.value ? `${textareaRef.current.scrollHeight}px` : 'auto';
    }
  }, [question, currentPage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load history based on User ID
  useEffect(() => {
    const storageKey = user ? `mathSolverHistory_${user.id}` : 'mathSolverHistory_guest';
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
    
    stopAudio();
  }, [user]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const handlePlayAudio = async (textToSpeak: string) => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    setIsLoadingAudio(true);
    try {
      // 1. Generate Audio Base64
      const base64Audio = await generateExplanationAudio(textToSpeak);

      // 2. Setup Audio Context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;

      // 3. Decode
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1
      );

      // 4. Play
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingAudio(false);
      
      audioSourceRef.current = source;
      source.start();
      setIsPlayingAudio(true);

    } catch (err) {
      console.error("Audio playback failed:", err);
      setError("Failed to play audio explanation.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleGenerateFlashcard = async (q: string, a: string, c: string) => {
    setIsLoading(true);
    try {
      const data = await createFlashcard(q, a, c);
      setFlashcardData(data);
    } catch (e) {
      setError("Failed to create flashcard");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Please upload files under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const base64Content = base64String.split(',')[1];
      
      setFileData({
        base64: base64Content,
        mimeType: file.type,
        name: file.name
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const clearFile = () => {
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNewChat = () => {
    setMessages([]);
    setQuestion('');
    setFileData(null);
    setError(null);
    setFlashcardData(null);
    stopAudio();
    setCurrentPage('home');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveToHistory = (q: string, res: SolveResponse, fData: FileData | null) => {
    const sourceType = fData 
      ? (fData.mimeType.includes('pdf') ? 'document' : 'image') 
      : 'text';
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      question: q || (fData ? `Analyzed ${fData.name}` : "Untitled Question"),
      answer: res.answer,
      timestamp: new Date().toISOString(),
      sourceType: sourceType as any,
      mode: solverMode
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    
    const storageKey = user ? `mathSolverHistory_${user.id}` : 'mathSolverHistory_guest';
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
  };

  const handleSolve = async () => {
    if ((!question.trim() && !fileData) || isLoading) return;

    const currentQuestion = question;
    const currentFileData = fileData;
    
    // Add user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: currentQuestion,
      fileData: currentFileData || undefined,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    setQuestion('');
    setFileData(null);
    stopAudio();
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Prepare context from previous interaction (if any)
    const lastBotMsg = messages.filter(m => m.role === 'model').pop();
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const context = lastBotMsg && lastUserMsg ? {
      previousQuestion: lastUserMsg.text,
      previousAnswer: lastBotMsg.response?.answer
    } : undefined;

    try {
      const response = await solveMathProblem(currentQuestion, currentFileData || undefined, solverMode, context);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '', // Using structured response instead
        response: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMsg]);
      saveToHistory(currentQuestion, response, currentFileData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      // Reset height of textarea
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSolve();
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setCurrentPage('home');
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: item.question,
      timestamp: item.timestamp
    };
    
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: '',
      response: {
        answer: item.answer,
        steps: ["(Loaded from History) - Detailed steps are available for new queries."],
        concept: "History Record"
      },
      timestamp: item.timestamp
    };
    
    setMessages(prev => [...prev, userMsg, botMsg]);
    setIsHistoryOpen(false);
    if (item.mode) setSolverMode(item.mode);
  };

  const clearHistory = () => {
    setHistory([]);
    const storageKey = user ? `mathSolverHistory_${user.id}` : 'mathSolverHistory_guest';
    localStorage.removeItem(storageKey);
  };

  const toggleMode = (mode: SolverMode) => {
    setSolverMode(mode);
    setShowModeSelector(false);
  };

  const renderContent = () => {
    if (currentPage === 'about') return <AboutPage onBack={() => setCurrentPage('home')} />;
    if (currentPage === 'video') return <VideoAnalyzer onBack={() => setCurrentPage('home')} />;
    if (currentPage === 'live') return <LiveSession onBack={() => setCurrentPage('home')} />;

    // Default: Home / Chat Interface
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto h-[calc(100vh-140px)]">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-2 md:px-4 py-6 space-y-6 pb-32 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-slide-up no-print">
              <div className="text-center space-y-4 mb-10 w-full">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                   Your Personal <span className="text-indigo-600">AI Tutor</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                  I can solve problems, explain concepts, and help you learn. Try asking me something!
                </p>
              </div>

              <div className="w-full max-w-2xl">
                 <p className="text-center text-sm text-slate-400 font-medium mb-4 uppercase tracking-wider">Try an example</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {EXAMPLE_PROBLEMS.map((ex, idx) => (
                     <button
                       key={idx}
                       onClick={() => {
                         setQuestion(ex.query);
                         if (ex.label === 'Search') setSolverMode('search');
                         else setSolverMode('standard');
                       }}
                       className="flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl text-left transition-all group"
                     >
                       <div>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${
                           ex.label === 'Search' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                         }`}>
                           {ex.label}
                         </span>
                         <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{ex.query}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          ) : (
             messages.map((msg) => (
               msg.role === 'user' ? (
                 <UserMessage key={msg.id} message={msg} />
               ) : (
                 <BotMessage 
                    key={msg.id} 
                    message={msg} 
                    onGenerateFlashcard={handleGenerateFlashcard}
                    onPlayAudio={handlePlayAudio}
                    isPlayingAudio={isPlayingAudio}
                    isLoadingAudio={isLoadingAudio}
                 />
               )
             ))
          )}
          
          {isLoading && (
            <div className="w-full max-w-4xl animate-pulse flex gap-4 no-print">
              <div className="w-10 h-10 bg-indigo-100 rounded-full shrink-0"></div>
              <div className="space-y-3 w-full max-w-lg">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-20 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full max-w-lg p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-scale-in no-print">
              <X className="w-4 h-4 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Composer (Sticky Bottom) */}
        <div className="absolute bottom-6 left-0 right-0 px-4 md:px-0 max-w-4xl mx-auto z-30 no-print">
           <div 
               className={`w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl transition-all duration-300 border relative ${isDragOver ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200/80'} ${isListening ? 'ring-4 ring-red-500/20 border-red-400' : ''}`}
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
               onDrop={handleDrop}
           >
             {isDragOver && (
               <div className="absolute inset-0 bg-indigo-50/90 backdrop-blur-sm z-20 rounded-2xl flex flex-col items-center justify-center text-indigo-600 animate-fade-in">
                 <Upload className="w-10 h-10 mb-2 animate-bounce" />
                 <p className="font-bold">Drop to attach</p>
               </div>
             )}

             {/* File Preview */}
             {fileData && (
               <div className="px-4 pt-3 animate-scale-in">
                   <div className="inline-flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg group relative max-w-full">
                       <div className="p-1.5 bg-white rounded border border-slate-100 shadow-sm">
                           {fileData.mimeType.includes('pdf') ? (
                               <FileText className="w-4 h-4 text-red-500" />
                           ) : (
                               <ImageIcon className="w-4 h-4 text-blue-500" />
                           )}
                       </div>
                       <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{fileData.name}</span>
                       <button 
                           onClick={clearFile}
                           className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors ml-1"
                       >
                           <X className="w-3 h-3" />
                       </button>
                   </div>
               </div>
             )}

             <div className="p-2 flex items-end gap-2">
                <div className="flex flex-col gap-2 pb-1.5 pl-2">
                   {/* Attach Button */}
                   <input
                     type="file"
                     id="file-upload"
                     ref={fileInputRef}
                     accept="image/*,.pdf,.docx"
                     onChange={handleFileChange}
                     className="hidden"
                   />
                   <button
                       onClick={() => fileInputRef.current?.click()}
                       className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                       title="Attach image or document"
                   >
                       <Paperclip className="w-5 h-5" />
                   </button>
                   
                   {/* Mode Selector */}
                   <div className="relative">
                      <button
                        onClick={() => setShowModeSelector(!showModeSelector)}
                        className={`p-2 rounded-lg transition-colors ${solverMode !== 'standard' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        title="Select Solver Mode"
                      >
                        {solverMode === 'fast' && <Zap className="w-5 h-5" />}
                        {solverMode === 'standard' && <Bot className="w-5 h-5" />}
                        {solverMode === 'search' && <Globe className="w-5 h-5" />}
                      </button>

                      {showModeSelector && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShowModeSelector(false)} />
                          <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-40 animate-scale-in origin-bottom-left">
                            <div className="p-2 space-y-1">
                              <button onClick={() => toggleMode('standard')} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${solverMode === 'standard' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                                <Bot className="w-4 h-4" />
                                <div>
                                  <p className="font-semibold">Standard Tutor</p>
                                  <p className="text-[10px] opacity-70">Balanced reasoning</p>
                                </div>
                              </button>
                              <button onClick={() => toggleMode('fast')} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${solverMode === 'fast' ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                                <Zap className="w-4 h-4" />
                                <div>
                                  <p className="font-semibold">Fast Mode</p>
                                  <p className="text-[10px] opacity-70">Low latency (Flash-Lite)</p>
                                </div>
                              </button>
                              <button onClick={() => toggleMode('search')} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${solverMode === 'search' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                                <Globe className="w-4 h-4" />
                                <div>
                                  <p className="font-semibold">Search Grounding</p>
                                  <p className="text-[10px] opacity-70">Real-world data</p>
                                </div>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                   </div>

                   {/* Voice Input Button */}
                   <button
                       onClick={toggleListening}
                       className={`p-2 rounded-lg transition-all duration-300 ${isListening ? 'text-white bg-red-500 animate-pulse shadow-md shadow-red-200' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                       title={isListening ? "Stop listening" : "Speak your question"}
                   >
                       {isLoading && isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                   </button>
                </div>

                <textarea
                   ref={textareaRef}
                   value={question}
                   onChange={(e) => setQuestion(e.target.value)}
                   onKeyDown={handleKeyDown}
                   placeholder={isListening ? "Listening..." : (solverMode === 'search' ? "Ask me to find data... (e.g. 'Population of Paris')" : "Ask me to explain, solve, or teach... (e.g. 'Teach me how to find the area of a circle')")}
                   className={`flex-1 p-3 max-h-[200px] min-h-[50px] bg-transparent border-none outline-none resize-none text-base text-slate-800 placeholder:text-slate-400 font-medium transition-colors ${isListening ? 'placeholder:text-red-500/70' : ''}`}
                   rows={1}
                   autoFocus
                 />

                <button
                    onClick={handleSolve}
                    disabled={isLoading || (!question.trim() && !fileData)}
                    className="mb-1.5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all hover:shadow-lg active:scale-95 text-sm"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <span>Go</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
             </div>
           </div>
           <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400">AI can make mistakes. Please verify important calculations.</p>
           </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      
      <Navbar 
        user={user} 
        onNavigate={(page) => setCurrentPage(page as PageType)}
        onHistoryClick={() => setIsHistoryOpen(true)} 
        onLoginClick={() => setShowAuthModal(true)}
        onLogoutClick={logout}
        onNewChat={handleNewChat}
      />

      <AuthModal />

      <FlashcardModal 
        isOpen={!!flashcardData}
        data={flashcardData}
        onClose={() => setFlashcardData(null)}
      />

      <main className="flex-grow flex flex-col w-full mx-auto">
        {renderContent()}
      </main>

      {/* Footer only on non-chat pages or if chat is empty to avoid clutter */}
      {(currentPage !== 'home' || messages.length === 0) && <Footer onNavigate={(page) => setCurrentPage(page as PageType)} />}

      {/* History Sidebar */}
      <HistorySidebar 
        isOpen={isHistoryOpen}
        history={history}
        onSelect={loadHistoryItem}
        onClear={clearHistory}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Overlay for Sidebar */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-fade-in no-print"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

    </div>
  );
};

export default App;
