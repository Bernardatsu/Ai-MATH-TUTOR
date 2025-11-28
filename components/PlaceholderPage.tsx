import React from 'react';
import { ArrowLeft, Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  onBack: () => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, onBack }) => (
  <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
    <div className="bg-indigo-50 p-8 rounded-full mb-6 shadow-sm border border-indigo-100">
      <Construction className="w-12 h-12 text-indigo-500" />
    </div>
    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{title}</h1>
    <p className="text-slate-500 max-w-md mb-8 text-lg leading-relaxed">
      This page is currently under development. We are working hard to bring you this feature in the next update!
    </p>
    <button 
      onClick={onBack}
      className="group flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      Back to Solver
    </button>
  </div>
);