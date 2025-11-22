import React, { useState } from 'react';
import { BatchItem } from '../types';

interface BatchImageCardProps {
  item: BatchItem;
  onRetry: (id: string) => void;
}

export const BatchImageCard: React.FC<BatchImageCardProps> = ({ item, onRetry }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleCompareStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOriginal(true);
  };

  const handleCompareEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOriginal(false);
  };

  const displaySrc = (item.status === 'SUCCESS' && item.resultBase64 && !showOriginal) 
    ? item.resultBase64 
    : item.previewUrl;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col group hover:border-gray-500 transition-colors">
      <div className="relative aspect-[2/3] bg-gray-900">
          <img 
            src={displaySrc} 
            alt={showOriginal ? "Original" : "Result"} 
            className={`w-full h-full object-cover transition-opacity duration-200 ${item.status === 'PROCESSING' ? 'opacity-50' : ''}`} 
          />
          
          {/* Status Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {item.status === 'PROCESSING' && (
                  <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                      <svg className="animate-spin h-8 w-8 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  </div>
              )}
              {item.status === 'SUCCESS' && (
                  <div className={`absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg transition-opacity ${showOriginal ? 'opacity-0' : 'opacity-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                  </div>
              )}
              {item.status === 'ERROR' && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg" title={item.error}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                  </div>
              )}
              {showOriginal && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Original
                </div>
              )}
          </div>
      </div>
      
      <div className="p-3 bg-gray-800 text-sm flex justify-between items-center border-t border-gray-700 gap-2">
          <span className="truncate flex-1 text-gray-300" title={item.file.name}>{item.file.name}</span>
          
          <div className="flex items-center gap-2">
              {/* Compare Button */}
              {item.status === 'SUCCESS' && (
                <button 
                    onMouseDown={handleCompareStart}
                    onMouseUp={handleCompareEnd}
                    onMouseLeave={handleCompareEnd}
                    onTouchStart={handleCompareStart}
                    onTouchEnd={handleCompareEnd}
                    className={`p-1.5 rounded-full transition-colors ${showOriginal ? 'bg-accent-blue text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Hold to compare with original"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
              )}

              {/* Retry Button */}
              {(item.status === 'SUCCESS' || item.status === 'ERROR') && (
                  <button 
                      onClick={() => onRetry(item.id)} 
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                      title="Retry this image"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                  </button>
              )}

              {/* Download Link */}
              {item.status === 'SUCCESS' && item.resultBase64 ? (
                  <a 
                      href={item.resultBase64} 
                      download={`colorized-${item.file.name}`}
                      className="text-accent-pink hover:text-white text-xs uppercase font-bold tracking-wider hover:underline ml-1"
                  >
                      Down
                  </a>
              ) : item.status === 'ERROR' ? (
                  <span className="text-red-400 text-xs">Failed</span>
              ) : (
                  <span className="text-gray-500 text-xs">Wait</span>
              )}
          </div>
      </div>
    </div>
  );
};