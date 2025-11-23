import React, { useState, useRef, useEffect } from 'react';
import { BatchItem } from '../types';

interface BatchImageCardProps {
  item: BatchItem;
  onRetry: (id: string) => void;
  onImprove: (id: string) => void;
  onCustomFix: (id: string, prompt: string, modifiedImageBase64?: string) => void;
  viewMode: 'grid' | 'list';
}

export const BatchImageCard: React.FC<BatchImageCardProps> = ({ item, onRetry, onImprove, onCustomFix, viewMode }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustomFixInput, setShowCustomFixInput] = useState(false);
  const [customFixText, setCustomFixText] = useState('');
  const [inputPosition, setInputPosition] = useState<'bottom' | 'top'>('bottom');
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDrawingRef = useRef(false);

  // Setup canvas when drawing mode is toggled or image loads
  useEffect(() => {
    if (showCustomFixInput && isDrawingMode && canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        
        // Match canvas resolution to image display size for coordinate accuracy
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
  }, [showCustomFixInput, isDrawingMode, isExpanded]);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isDrawingMode || !canvasRef.current) return;
      isDrawingRef.current = true;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
          ctx.beginPath();
          ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDrawingMode || !isDrawingRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
          ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          ctx.stroke();
      }
  };

  const handleMouseUp = () => {
      isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  };

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

  const handleCustomFixSubmit = () => {
    if (customFixText.trim()) {
        let finalPrompt = customFixText;
        let modifiedBase64: string | undefined = undefined;

        // If user drew on the canvas, merge it
        if (isDrawingMode && canvasRef.current && imageRef.current) {
            // Create a temporary canvas to merge the underlying image and the drawing
            const tempCanvas = document.createElement('canvas');
            const img = imageRef.current;
            
            // Use natural size for best quality
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            const ctx = tempCanvas.getContext('2d');
            
            if (ctx) {
                // Draw original image (which is the generated result if successful)
                ctx.drawImage(img, 0, 0);
                
                // Draw the annotation overlay, scaled up
                ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // Get Base64
                const mergedData = tempCanvas.toDataURL('image/png');
                modifiedBase64 = mergedData.split(',')[1];
                
                // Add tag to prompt so service knows to look for red mask
                finalPrompt = `[RED_MASK] ${customFixText}`;
            }
        }

        onCustomFix(item.id, finalPrompt, modifiedBase64);
        setShowCustomFixInput(false);
        setCustomFixText('');
        setIsDrawingMode(false);
    }
  };

  const displaySrc = (item.status === 'SUCCESS' && item.resultBase64 && !showOriginal) 
    ? item.resultBase64 
    : item.previewUrl;

  const renderCompareButton = () => {
    if (item.status !== 'SUCCESS') return null;
    return (
        <button 
            onMouseDown={handleCompareStart}
            onMouseUp={handleCompareEnd}
            onMouseLeave={handleCompareEnd}
            onTouchStart={handleCompareStart}
            onTouchEnd={handleCompareEnd}
            className={`p-1.5 rounded-full transition-colors pointer-events-auto shadow-lg ${showOriginal ? 'bg-accent-blue text-black' : 'bg-black/50 text-gray-300 hover:text-white hover:bg-black/70'}`}
            title="Hold to compare with original"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        </button>
    );
  };

  const renderImageArea = () => (
    <div className="relative aspect-[2/3] bg-gray-900 w-full h-full select-none group/image">
        <img 
            ref={imageRef}
            src={displaySrc} 
            alt={showOriginal ? "Original" : "Result"} 
            className={`w-full h-full object-cover transition-opacity duration-200 ${item.status === 'PROCESSING' ? 'opacity-50' : ''}`} 
            onDragStart={(e) => e.preventDefault()}
        />
        
        {/* Canvas Overlay for Drawing */}
        {showCustomFixInput && isDrawingMode && (
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair z-30 touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        )}
        
        {/* Status Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {item.status === 'PROCESSING' && (
                <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm z-40">
                    <svg className="animate-spin h-8 w-8 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
            {item.status === 'SUCCESS' && !showCustomFixInput && (
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
        
        {/* Compare Button Overlay - integrated for both views */}
        {!showCustomFixInput && !isDrawingMode && item.status === 'SUCCESS' && (
             <div className="absolute bottom-2 right-2 z-10 pointer-events-auto">
                 {renderCompareButton()}
             </div>
        )}

        {/* Custom Fix Input Overlay (Grid Mode) */}
        {/* Fix: z-40 allows controls to be above canvas(z-30), but pointer-events-none on container lets clicks pass through to canvas for drawing */}
        {showCustomFixInput && viewMode === 'grid' && (
            <div className={`absolute inset-0 flex flex-col ${inputPosition === 'bottom' ? 'justify-end bg-gradient-to-t' : 'justify-start bg-gradient-to-b'} from-black via-black/80 to-transparent p-2 z-40 pointer-events-none transition-all`}>
                 <div className="w-full bg-gray-900/90 rounded-lg p-3 border border-gray-600 backdrop-blur-sm animate-fade-in-up pointer-events-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <p className="text-white text-xs font-bold">Fix Request</p>
                            <button 
                                onClick={() => setInputPosition(prev => prev === 'bottom' ? 'top' : 'bottom')}
                                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                                title={inputPosition === 'bottom' ? "Move to Top" : "Move to Bottom"}
                            >
                                {inputPosition === 'bottom' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                )}
                            </button>
                        </div>
                        
                        {/* Drawing Toggle Logic */}
                        {!isDrawingMode ? (
                            <button 
                                onClick={() => {
                                    setIsDrawingMode(true);
                                    // Reset canvas when starting to draw
                                    setTimeout(() => handleClearCanvas(), 10);
                                }}
                                className="text-xs px-2 py-0.5 rounded border bg-gray-700 border-gray-600 text-gray-300 hover:text-white hover:border-accent-blue"
                            >
                                ✏️ Draw Mask
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleClearCanvas}
                                    className="text-[10px] text-red-300 hover:text-white underline"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={() => setIsDrawingMode(false)}
                                    className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-bold hover:bg-green-500"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <textarea 
                        value={customFixText}
                        onChange={(e) => setCustomFixText(e.target.value)}
                        placeholder={isDrawingMode ? "What to do in red area?" : "e.g. Make hair red..."}
                        className="w-full h-12 bg-gray-800 text-white text-xs p-2 rounded border border-gray-600 mb-2 focus:border-accent-blue focus:outline-none resize-none"
                        autoFocus={!isDrawingMode}
                    />

                    <div className="flex gap-2 w-full">
                        <button 
                            onClick={() => { setShowCustomFixInput(false); setIsDrawingMode(false); }}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCustomFixSubmit}
                            className="flex-1 bg-accent-blue hover:bg-blue-400 text-black font-bold text-xs py-1 rounded"
                        >
                            Fix
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderImproveButton = (inList: boolean = false) => {
    if (item.status !== 'SUCCESS') return null;
    const baseClass = "p-1.5 rounded-full transition-colors flex items-center gap-1";
    const variantClass = inList
        ? "text-yellow-400 hover:text-black hover:bg-yellow-400 bg-gray-800 border border-yellow-600/30"
        : "text-yellow-400 hover:text-white hover:bg-yellow-600/50";
    
    return (
        <button
            onClick={() => onImprove(item.id)}
            className={`${baseClass} ${variantClass}`}
            title="Auto Improve (Fix B&W parts)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-4a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zm-1 9a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {inList && <span className="text-xs font-bold">Auto Fix</span>}
        </button>
    );
  };

  const renderCustomFixButton = (inList: boolean = false) => {
    if (item.status !== 'SUCCESS') return null;
    const baseClass = "p-1.5 rounded-full transition-colors flex items-center gap-1";
    const variantClass = inList
        ? "text-accent-blue hover:text-black hover:bg-accent-blue bg-gray-800 border border-accent-blue/30"
        : "text-accent-blue hover:text-white hover:bg-blue-600/50";
    
    return (
        <button
            onClick={() => {
                setShowCustomFixInput(!showCustomFixInput);
                if (inList && !isExpanded) setIsExpanded(true);
            }}
            className={`${baseClass} ${variantClass}`}
            title="Custom Fix (Prompt changes)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            {inList && <span className="text-xs font-bold">Custom Fix</span>}
        </button>
    );
  };

  const renderRetryButton = (inList: boolean = false) => {
    if (item.status !== 'SUCCESS' && item.status !== 'ERROR') return null;
    const baseClass = "p-1.5 rounded-full transition-colors flex items-center gap-1";
    const variantClass = inList 
        ? "text-gray-400 hover:text-white hover:bg-gray-700 bg-gray-800 border border-gray-700" 
        : "text-gray-400 hover:text-white hover:bg-gray-700";
    
    return (
        <button 
            onClick={() => onRetry(item.id)} 
            className={`${baseClass} ${variantClass}`}
            title="Retry this image (From Original)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {inList && <span className="text-xs">Retry</span>}
        </button>
    );
  };

  const renderDownloadButton = (inList: boolean = false) => {
      if (item.status !== 'SUCCESS' || !item.resultBase64) return null;
      
      const baseClass = "text-xs uppercase font-bold tracking-wider ml-1 flex items-center gap-1";
      const variantClass = inList 
        ? "bg-accent-pink text-white px-3 py-1.5 rounded-lg hover:bg-pink-600 transition-colors shadow-sm" 
        : "text-accent-pink hover:text-white hover:underline";

      return (
        <a 
            href={item.resultBase64} 
            download={`colorized-${item.file.name}`}
            className={`${baseClass} ${variantClass}`}
        >
            {inList && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
            {inList ? "Download" : "Down"}
        </a>
      );
  };


  if (viewMode === 'grid') {
    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col group hover:border-gray-500 transition-colors">
          <div className="relative aspect-[2/3]">
              {renderImageArea()}
          </div>
          
          {/* Hide footer in grid mode if custom fix input is open to give more space */}
          {!showCustomFixInput && (
            <div className="p-3 bg-gray-800 text-sm flex justify-between items-center border-t border-gray-700 gap-2">
                <span className="truncate flex-1 text-gray-300" title={item.file.name}>{item.file.name}</span>
                
                <div className="flex items-center gap-2">
                    {renderCustomFixButton(false)}
                    {renderImproveButton(false)}
                    {renderRetryButton(false)}
        
                    {item.status === 'SUCCESS' && item.resultBase64 ? (
                        renderDownloadButton(false)
                    ) : item.status === 'ERROR' ? (
                        <span className="text-red-400 text-xs">Failed</span>
                    ) : (
                        <span className="text-gray-500 text-xs">Wait</span>
                    )}
                </div>
            </div>
          )}
        </div>
      );
  }

  // LIST VIEW
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden group hover:border-gray-500 transition-colors">
       {/* Row Header */}
       <div className="p-4 flex items-center gap-4">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            {item.status === 'PROCESSING' && (
                 <svg className="animate-spin h-5 w-5 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            )}
            {item.status === 'SUCCESS' && (
                 <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            )}
            {item.status === 'ERROR' && (
                 <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            )}
            {item.status === 'QUEUED' && (
                 <div className="h-5 w-5 rounded-full border-2 border-gray-600"></div>
            )}
          </div>
          
          {/* Filename */}
          <span className="truncate flex-1 text-gray-300 font-medium">{item.file.name}</span>

          {/* Actions */}
          <div className="flex items-center gap-2">
             {item.status === 'ERROR' && <span className="text-red-400 text-xs mr-2 hidden sm:inline">{item.error}</span>}
             {renderCustomFixButton(true)}
             {renderImproveButton(true)}
             {renderRetryButton(true)}
             {renderDownloadButton(true)}
             
             {/* Expand Toggle */}
             <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-2"
                title={isExpanded ? "Collapse" : "Expand to see image"}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
             </button>
          </div>
       </div>

       {/* Expanded Image Area */}
       {isExpanded && (
         <div className="border-t border-gray-700 bg-gray-900/50 p-4 animate-fade-in-up">
             {showCustomFixInput && (
                 <div className="mb-4 bg-gray-800 p-3 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-xs font-bold uppercase">Fix Request</h4>
                        
                        {/* Improved Drawing Controls for List View */}
                        {!isDrawingMode ? (
                             <button 
                                onClick={() => {
                                    setIsDrawingMode(true);
                                    setTimeout(() => handleClearCanvas(), 10);
                                }}
                                className="text-xs px-2 py-0.5 rounded border bg-gray-700 border-gray-600 text-gray-300 hover:text-white hover:border-accent-blue"
                            >
                                ✏️ Draw Mask
                            </button>
                        ) : (
                             <div className="flex gap-2">
                                <button 
                                    onClick={handleClearCanvas}
                                    className="text-[10px] text-red-300 hover:text-white underline"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={() => setIsDrawingMode(false)}
                                    className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-bold hover:bg-green-500"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            value={customFixText}
                            onChange={(e) => setCustomFixText(e.target.value)}
                            placeholder={isDrawingMode ? "What to do in red area?" : "Describe what to fix..."}
                            className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-accent-blue border border-gray-700"
                            autoFocus={!isDrawingMode}
                        />
                        <button onClick={() => setShowCustomFixInput(false)} className="px-3 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleCustomFixSubmit} className="px-4 py-2 bg-accent-blue text-black font-bold rounded text-sm hover:bg-blue-400">Apply Fix</button>
                    </div>
                    {isDrawingMode && (
                        <p className="text-[10px] text-gray-400">Draw on the image below to highlight areas. <span onClick={handleClearCanvas} className="text-red-400 cursor-pointer hover:underline ml-2">Clear Drawing</span></p>
                    )}
                 </div>
             )}

             <div className="relative aspect-[2/3] max-w-sm mx-auto rounded-lg overflow-hidden shadow-2xl border border-gray-700">
                {renderImageArea()}
             </div>
         </div>
       )}
    </div>
  );
};