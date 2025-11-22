import React, { useRef, useState } from 'react';

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      if (filesArray.length > 0) {
        onFilesSelect(filesArray);
      }
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      onFilesSelect(filesArray);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full max-w-2xl mx-auto h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${isDragging 
          ? 'border-accent-pink bg-accent-pink/10 scale-[1.02]' 
          : 'border-gray-600 hover:border-accent-blue hover:bg-gray-800/50 bg-gray-900/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <div className="text-center p-6">
        <svg 
            className={`mx-auto h-16 w-16 mb-4 transition-colors ${isDragging ? 'text-accent-pink' : 'text-gray-400'}`} 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48" 
            aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M24 8v32m16-16H8" 
          />
        </svg>
        <p className="text-xl font-bold text-gray-200">
          Drop your Manga pages here
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Single file or select multiple images for batch processing
        </p>
      </div>
    </div>
  );
};