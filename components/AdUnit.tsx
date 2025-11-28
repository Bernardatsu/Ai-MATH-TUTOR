
import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'auto', className = '' }) => {
  const adPushed = useRef(false);

  useEffect(() => {
    // Prevent multiple pushes for the same component instance (React Strict Mode fix)
    if (adPushed.current) return;

    try {
      // Push the ad to the Google Ads queue
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adPushed.current = true;
    } catch (e: any) {
      // Suppress the specific "already have ads" error which is common in React SPAs
      // This is a benign error indicating the slot is already filled.
      if (e.message && e.message.includes('already have ads')) {
        return;
      }
      console.error("AdSense error", e);
    }
  }, []);

  // If running in development or without a real ID, show a placeholder
  const isDev = slotId === 'YOUR_AD_SLOT_ID';

  if (isDev) {
    return (
      <div className={`bg-slate-100 border border-slate-200 border-dashed rounded-lg flex items-center justify-center text-slate-400 text-xs font-medium uppercase tracking-wider p-4 ${className}`} style={{ minHeight: '100px' }}>
        Advertisement Space
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-YOUR_PUBLISHER_ID" // REPLACE THIS
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
    </div>
  );
};
