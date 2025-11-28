import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

declare global {
  interface Window {
    MathJax: {
      typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
      typeset?: (elements: HTMLElement[]) => void;
    };
  }
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax) {
      // Clear previous content to avoid duplication/artifacts before re-rendering
      containerRef.current.innerHTML = content;
      
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([containerRef.current]).catch((err) =>
          console.error('MathJax typeset failed: ', err)
        );
      } else if (window.MathJax.typeset) {
        window.MathJax.typeset([containerRef.current]);
      }
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`prose prose-slate max-w-none ${className}`}
    />
  );
};
