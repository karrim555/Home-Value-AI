// FIX: Implemented the ImageComparer component to resolve the "not a module" error.
// This component provides a visual slider to compare two images.
import React, { useState, useRef, useCallback, MouseEvent, TouchEvent, useEffect } from 'react';

interface ImageComparerProps {
  before: string;
  after: string;
}

const ImageComparer: React.FC<ImageComparerProps> = ({ before, after }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.preventDefault();
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
  };

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);
  
  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
      handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseUp, handleMouseMove, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
    >
      <img
        src={after}
        alt="After"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={before}
          alt="Before"
          className="absolute top-0 left-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full bg-white/80 border-2 border-white shadow-md flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ImageComparer;
