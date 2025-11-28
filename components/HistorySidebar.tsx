
import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, FileText, Image as ImageIcon, Type as TypeIcon, X, Calculator } from 'lucide-react';
import { AdUnit } from './AdUnit';

interface HistorySidebarProps {
  isOpen: boolean;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  history,
  onSelect,
  onClear,
  onClose
}) => {
  return (
    <div 
      className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-50 flex flex-col border-l border-white/20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
             <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg leading-none">History</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Your solved problems</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        
        {/* Ad Unit placed at top of history */}
        <div className="mb-4">
           <AdUnit slotId="YOUR_AD_SLOT_ID" className="w-full" />
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center space-y-4 px-8 animate-fade-in">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <Calculator className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-medium text-slate-500">No solved problems yet</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculations you perform will automatically appear here for quick access.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full text-left group relative bg-white hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wide
                  ${item.sourceType === 'image' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                    item.sourceType === 'document' ? 'bg-red-50 text-red-600 border border-red-100' : 
                    'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {item.sourceType === 'image' && <ImageIcon size={10} />}
                  {item.sourceType === 'document' && <FileText size={10} />}
                  {item.sourceType === 'text' && <TypeIcon size={10} />}
                  {item.sourceType}
                </span>
                <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <h4 className="text-sm text-slate-700 font-semibold line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors leading-snug">
                {item.question}
              </h4>
              
              <div className="text-xs text-slate-500 line-clamp-1 pl-2 border-l-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                <span className="opacity-70">Ans:</span> {item.answer}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Sidebar Footer */}
      {history.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
};
