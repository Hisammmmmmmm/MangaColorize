import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageComparatorProps {
  originalSrc: string;
  colorizedSrc: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ originalSrc, colorizedSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const handleMouseDown = () => setIsResizing(true);
  const handleTouchStart = () => setIsResizing(true);

  const handleMouseUp = () => setIsResizing(false);
  const handleTouchEnd = () => setIsResizing(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing, handleMove]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 select-none">
        <div className="mb-4 flex justify-between text-sm text-gray-400 uppercase tracking-widest font-bold">
            <span>Original (B&W)</span>
            <span>AI Colorized</span>
        </div>
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl shadow-2xl border-4 border-gray-800 bg-gray-900 group cursor-col-resize"
        onMouseDown={(e) => {
            setIsResizing(true);
            handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
            setIsResizing(true);
            handleMove(e.touches[0].clientX);
        }}
        style={{ minHeight: '300px' }}
      >
        {/* Colorized Image (Background/Underneath) */}
        <img 
          src={colorizedSrc} 
          alt="Colorized" 
          className="w-full h-auto block select-none pointer-events-none" 
        />

        {/* Original Image (Foreground/Clipped) */}
        <div 
          className="absolute top-0 left-0 h-full w-full select-none pointer-events-none"
          style={{ 
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
          }}
        >
          <img 
            src={originalSrc} 
            alt="Original" 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
        
        {/* Hint text that fades out */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            Drag to compare
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
          <a 
            href={colorizedSrc} 
            download="manga-colorized.png"
            className="text-accent-blue hover:text-white underline text-sm transition-colors"
          >
            Download Colorized Version
          </a>
      </div>
    </div>
  );
};