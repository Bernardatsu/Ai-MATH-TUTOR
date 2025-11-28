
import React, { useState, useRef } from 'react';
import { Upload, Video, Loader2, Play, Sparkles, FileVideo, X, ArrowLeft } from 'lucide-react';
import { FileData } from '../types';
import { analyzeVideo } from '../services/geminiService';
import { MathRenderer } from './MathRenderer';

interface VideoAnalyzerProps {
  onBack: () => void;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ onBack }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit video size for client-side demo (approx 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("Video file is too large. Please upload a video smaller than 50MB.");
      return;
    }

    setVideoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const base64Content = base64String.split(',')[1];
      
      setFileData({
        base64: base64Content,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!fileData || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeVideo(prompt, fileData);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze video");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setVideoFile(null);
    setFileData(null);
    setPreviewUrl(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-slide-up">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Video <span className="text-indigo-600">Intelligence</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Upload a video to analyze key concepts, solve visible math problems, or extract insights using Gemini 1.5 Pro.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Upload & Input */}
        <div className="space-y-6">
          <div 
            className={`bg-white rounded-2xl shadow-xl border overflow-hidden transition-all ${videoFile ? 'border-indigo-100' : 'border-slate-200 border-dashed hover:border-indigo-400'}`}
          >
            {!videoFile ? (
              <div 
                className="h-64 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <p className="font-semibold text-slate-700">Click to Upload Video</p>
                <p className="text-xs text-slate-400 mt-1">MP4, MOV, WebM (Max 50MB)</p>
              </div>
            ) : (
              <div className="relative bg-black h-64 flex items-center justify-center">
                <video 
                  src={previewUrl!} 
                  controls 
                  className="h-full w-full object-contain"
                />
                <button 
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask something about the video... (e.g., 'Explain the physics experiment shown', 'What formulas are written on the board?')"
              className="w-full p-4 min-h-[100px] bg-transparent border-none outline-none resize-none text-slate-800 placeholder:text-slate-400"
            />
            <div className="flex justify-between items-center px-4 pb-2">
              <span className="text-xs text-slate-400 font-medium">Powered by Gemini Pro</span>
              <button
                onClick={handleAnalyze}
                disabled={!fileData || isLoading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Video</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="h-full min-h-[300px]">
          {analysis ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 h-full p-6 md:p-8 animate-fade-in relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <FileVideo className="w-32 h-32" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-500" />
                 Analysis Result
               </h3>
               <div className="prose prose-slate max-w-none">
                 <MathRenderer content={analysis} className="text-slate-700 leading-relaxed" />
               </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                <Play className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-medium">No analysis yet</p>
              <p className="text-sm mt-2 max-w-xs">Upload a video and ask a question to see AI insights here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
