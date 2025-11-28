
import React, { useRef } from 'react';
import { X, Download, RotateCcw, Lightbulb } from 'lucide-react';
import { FlashcardData } from '../types';
import { MathRenderer } from './MathRenderer';

interface FlashcardModalProps {
  isOpen: boolean;
  data: FlashcardData | null;
  onClose: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, data, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handleDownload = () => {
    // Basic canvas drawing logic to export as image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions - Taller to accommodate dynamic text
    canvas.width = 1200;
    canvas.height = 1400;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gradient border/top bar
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#4f46e5'); // Indigo-600
    gradient.addColorStop(1, '#7c3aed'); // Violet-600
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 40);

    // Text configuration
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; // Easier for calculating flow

    let currentY = 100; // Start Y position

    // Title (Front)
    ctx.fillStyle = '#1e293b'; // Slate-800
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('Question', canvas.width / 2, currentY);
    currentY += 80;

    // Question Text - Dynamic Wrapping
    ctx.font = '40px sans-serif';
    currentY = wrapText(ctx, data.front, canvas.width / 2, currentY, 1000, 60);

    // Separator logic
    currentY += 60; // Padding before line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, currentY);
    ctx.lineTo(1100, currentY);
    ctx.stroke();
    currentY += 80; // Padding after line

    // Answer (Back)
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('Answer', canvas.width / 2, currentY);
    currentY += 80;

    ctx.fillStyle = '#334155';
    ctx.font = '40px sans-serif';
    currentY = wrapText(ctx, data.back, canvas.width / 2, currentY, 1000, 60);

    // Tip - Drawn relative to where the Answer ended
    if (data.tip) {
       currentY += 100; // Large gap for the tip section
       
       // Draw a subtle background box for the tip
       const tipBoxY = currentY - 20;
       // We can't easily know height beforehand without measuring, 
       // but we can draw the text and decorations simply.
       
       ctx.fillStyle = '#d97706'; // Amber-600
       ctx.font = 'italic 32px sans-serif';
       
       // Draw "Tip:" label
       ctx.fillText('Study Tip:', canvas.width / 2, currentY);
       currentY += 50;
       
       // Draw Tip text
       ctx.fillStyle = '#92400e'; // Amber-800
       ctx.font = '32px sans-serif';
       currentY = wrapText(ctx, data.tip, canvas.width / 2, currentY, 900, 45);
    }

    // Download
    const link = document.createElement('a');
    link.download = 'math-flashcard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Helper to wrap text and return the new Y position
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight; // Return next available Y line
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            Study Flashcard
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50" ref={cardRef}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Front */}
            <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Front (Question)</span>
              <div className="text-xl md:text-2xl font-medium text-slate-800">
                <MathRenderer content={data.front} />
              </div>
            </div>

            {/* Back */}
            <div className="p-8 bg-white">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Back (Answer)</span>
               <div className="text-xl md:text-2xl font-bold text-indigo-700">
                <MathRenderer content={data.back} />
              </div>
            </div>
            
            {/* Tip */}
            {data.tip && (
               <div className="px-8 py-4 bg-amber-50 border-t border-amber-100 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-800 italic">
                    <span className="font-bold not-italic mr-1">Study Tip:</span> 
                    {data.tip}
                  </p>
               </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
};
