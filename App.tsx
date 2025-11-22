import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, ProcessingError, ColorizationStyle, BatchItem } from './types';
import { fileToBase64, createObjectURL } from './utils/fileHelper';
import { colorizeMangaPage } from './services/geminiService';
import { Dropzone } from './components/Dropzone';
import { Button } from './components/Button';
import { ImageComparator } from './components/ImageComparator';
import { BatchImageCard } from './components/BatchImageCard';

const STYLE_OPTIONS: { id: ColorizationStyle; label: string; description: string; gradient: string }[] = [
  { id: 'vibrant', label: 'Vibrant Anime', description: 'Classic saturated look', gradient: 'from-pink-500 via-purple-500 to-blue-500' },
  { id: 'pastel', label: 'Soft Pastel', description: 'Dreamy watercolor vibes', gradient: 'from-pink-300 via-purple-200 to-blue-200' },
  { id: 'painterly', label: 'Lush Painterly', description: 'Rich textures & soft blending', gradient: 'from-emerald-400 via-teal-500 to-cyan-600' },
  { id: 'gritty', label: 'Dark & Gritty', description: 'High contrast & shadows', gradient: 'from-gray-900 via-gray-700 to-red-900' },
  { id: 'retro', label: 'Retro 90s', description: 'Vintage cel-shaded', gradient: 'from-yellow-400 via-orange-400 to-red-400' },
  { id: 'custom', label: 'Custom Prompt', description: 'Write your own style', gradient: 'from-slate-500 via-slate-600 to-slate-700' },
];

const App: React.FC = () => {
  // Global State
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedStyle, setSelectedStyle] = useState<ColorizationStyle>('vibrant');
  const [mangaTitle, setMangaTitle] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Single Mode State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultBase64, setResultBase64] = useState<string | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);

  // Batch Mode State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const stopBatchRef = useRef<boolean>(false);
  
  // Track object URLs for cleanup to avoid dependency cycles in useEffect
  const objectUrlsRef = useRef<string[]>([]);

  const isBatchMode = batchItems.length > 0;

  // Computed Progress Stats
  const totalFiles = batchItems.length;
  const processedCount = batchItems.filter(i => i.status === 'SUCCESS' || i.status === 'ERROR').length;
  const progressPercent = totalFiles > 0 ? Math.round((processedCount / totalFiles) * 100) : 0;

  // Cleanup object URLs only on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFilesSelect = (selectedFiles: File[]) => {
    // Cleanup old URLs
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    
    // Reset previous states
    reset();

    if (selectedFiles.length === 1) {
      // Single File Mode
      const f = selectedFiles[0];
      const url = createObjectURL(f);
      objectUrlsRef.current.push(url);
      
      setFile(f);
      setPreviewUrl(url);
    } else {
      // Batch Mode
      const items: BatchItem[] = selectedFiles.map(f => {
        const url = createObjectURL(f);
        objectUrlsRef.current.push(url);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file: f,
          previewUrl: url,
          status: 'QUEUED'
        };
      });
      setBatchItems(items);
    }
    setStatus(AppStatus.IDLE);
  };

  // --- Core Processing Logic ---
  const colorizeItem = async (id: string, file: File) => {
    // Update specific item status to PROCESSING
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'PROCESSING', error: undefined } : item
    ));

    try {
      const base64 = await fileToBase64(file);
      // Note: selectedStyle, mangaTitle, and customPrompt are captured from the current closure.
      const generatedImage = await colorizeMangaPage(base64, file.type, selectedStyle, mangaTitle, customPrompt);
      
      setBatchItems(prev => prev.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'SUCCESS', 
          resultBase64: `data:image/png;base64,${generatedImage}` 
        } : item
      ));
    } catch (err: any) {
      setBatchItems(prev => prev.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'ERROR', 
          error: err.message || 'Failed' 
        } : item
      ));
    }
  };

  // --- Single Processing ---
  const handleColorizeSingle = async () => {
    if (!file) return;
    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const generatedImage = await colorizeMangaPage(base64, file.type, selectedStyle, mangaTitle, customPrompt);
      setResultBase64(`data:image/png;base64,${generatedImage}`);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError({
        message: "Failed to colorize image",
        details: err.message || "Unknown error occurred with Gemini API"
      });
      setStatus(AppStatus.ERROR);
    }
  };

  const handleRetrySingle = () => {
    setResultBase64(null);
    setStatus(AppStatus.IDLE);
    setError(null);
  };

  // --- Batch Processing ---
  const startBatchProcessing = async () => {
    if (batchItems.length === 0) return;
    
    setStatus(AppStatus.PROCESSING);
    stopBatchRef.current = false;

    // Create a copy to iterate over
    const items = [...batchItems];

    for (const item of items) {
      if (stopBatchRef.current) break;
      
      // Skip if already successful
      if (item.status === 'SUCCESS') continue;

      await colorizeItem(item.id, item.file);
    }

    if (stopBatchRef.current) {
        setStatus(AppStatus.IDLE); 
    } else {
        setStatus(AppStatus.SUCCESS);
    }
  };

  const stopBatch = () => {
    stopBatchRef.current = true;
  };

  const handleRetryItem = (id: string) => {
    const item = batchItems.find(i => i.id === id);
    if (item) {
      colorizeItem(id, item.file);
    }
  };

  const handleDownloadAll = () => {
    const successfulItems = batchItems.filter(i => i.status === 'SUCCESS' && i.resultBase64);
    successfulItems.forEach((item, index) => {
      setTimeout(() => {
        if (item.resultBase64) {
          const link = document.createElement('a');
          link.href = item.resultBase64;
          link.download = `colorized-${item.file.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, index * 500); // Stagger downloads to prevent browser blocking
    });
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultBase64(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setBatchItems([]);
    setMangaTitle('');
    setCustomPrompt('');
  };

  // --- RENDER HELPERS ---
  const renderConfiguration = () => (
    <div className="w-full max-w-3xl space-y-8 animate-fade-in-up">
      {/* Manga Title Input */}
      <div>
        <p className="text-center text-gray-400 mb-3 text-sm uppercase tracking-widest font-bold">Manga Title (Optional)</p>
        <div className="relative max-w-md mx-auto">
          <input 
            type="text"
            value={mangaTitle}
            onChange={(e) => setMangaTitle(e.target.value)}
            placeholder="e.g. One Piece, Naruto, Berserk..."
            className="w-full px-5 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all text-center"
          />
        </div>
        <p className="text-center text-gray-500 text-xs mt-2">Helps the AI choose correct character and location colors.</p>
      </div>

      {/* Style Selector */}
      <div>
        <p className="text-center text-gray-400 mb-4 text-sm uppercase tracking-widest font-bold">Select Art Style</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 text-center group
                ${selectedStyle === style.id
                  ? 'border-accent-pink bg-accent-pink/10 shadow-[0_0_20px_rgba(255,0,122,0.2)] scale-105 z-10' 
                  : 'border-gray-700 bg-gray-800/40 hover:bg-gray-800 hover:border-gray-500'
                }
              `}
            >
              <div className={`w-full h-3 rounded-full mb-1 bg-gradient-to-r ${style.gradient} shadow-sm`}></div>
              <div className="flex flex-col">
                <span className={`font-bold text-sm ${selectedStyle === style.id ? 'text-white' : 'text-gray-300'}`}>
                    {style.label}
                </span>
                <span className="text-[10px] text-gray-500 leading-tight mt-1">
                    {style.description}
                </span>
              </div>
              {selectedStyle === style.id && (
                <div className="absolute -top-2 -right-2 bg-accent-pink text-white rounded-full p-1 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Input */}
      {selectedStyle === 'custom' && (
        <div className="animate-fade-in-up">
          <p className="text-center text-gray-400 mb-3 text-sm uppercase tracking-widest font-bold">Custom Instructions</p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Colorize this manga panel of One Punch Man using deep reds and gold accents, keep shadows heavy..."
            className="w-full h-24 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink transition-all resize-none"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-accent-pink selection:text-white pb-20">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="font-comic text-6xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-accent-pink via-purple-400 to-accent-blue tracking-wider drop-shadow-lg mb-4">
            MANGA<span className="text-white">COLORIZE</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Bring your favorite manga panels to life using the power of <span className="text-accent-blue font-semibold">Gemini Nano Banana</span>.
            Preserves text bubbles. Instantly vibrant.
          </p>
        </header>

        <main className="max-w-5xl mx-auto">
          
          {/* --- IDLE STATE: DROPZONE --- */}
          {!file && batchItems.length === 0 && (
             <div className="bg-gray-800/30 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 shadow-2xl animate-fade-in-up">
               <Dropzone onFilesSelect={handleFilesSelect} />
             </div>
          )}

          {/* --- SINGLE FILE MODE --- */}
          {file && !isBatchMode && (
            <div className="space-y-8 animate-fade-in-up">
              {status !== AppStatus.SUCCESS && (
                <div className="flex flex-col items-center space-y-8">
                  <div className="relative group w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800">
                    <img src={previewUrl!} alt="Preview" className="w-full h-auto" />
                    <button 
                      onClick={reset}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-red-500/80 text-white p-2 rounded-full transition-colors"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {renderConfiguration()}

                  <div className="flex gap-4 pt-4">
                    <Button 
                        onClick={handleColorizeSingle} 
                        isLoading={status === AppStatus.PROCESSING}
                        className="text-lg px-12 py-4"
                    >
                      {status === AppStatus.PROCESSING ? 'Painting...' : '✨ Colorize Now'}
                    </Button>
                  </div>

                  {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg max-w-2xl mx-auto text-center">
                      <p className="font-bold">Error Processing Image</p>
                      <p className="text-sm mt-1 opacity-80">{error.details}</p>
                      <button onClick={() => setStatus(AppStatus.IDLE)} className="mt-2 text-xs underline hover:text-white">Try Again</button>
                    </div>
                  )}
                </div>
              )}

              {status === AppStatus.SUCCESS && previewUrl && resultBase64 && (
                <div className="animate-fade-in-up space-y-8 text-center">
                   <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4">
                     <h2 className="text-3xl font-bold text-white">Result</h2>
                     <div className="flex flex-wrap justify-center gap-3">
                       <Button variant="secondary" onClick={handleRetrySingle} className="text-sm px-4 py-2">
                          Adjust & Retry
                       </Button>
                       <Button variant="outline" onClick={reset} className="text-sm px-4 py-2">
                          New Image
                       </Button>
                     </div>
                   </div>
                   <ImageComparator originalSrc={previewUrl} colorizedSrc={resultBase64} />
                </div>
              )}
            </div>
          )}

          {/* --- BATCH MODE --- */}
          {isBatchMode && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-6 mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Batch Processing 
                    <span className="bg-accent-blue text-black text-xs px-2 py-1 rounded-full font-bold">{batchItems.length} files</span>
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {batchItems.some(i => i.status === 'SUCCESS') && (
                     <Button variant="secondary" onClick={handleDownloadAll} className="text-sm px-4 py-2 bg-gray-800 border-gray-600">
                        Download All
                     </Button>
                  )}
                  
                  {status !== AppStatus.PROCESSING && (
                     <Button variant="outline" onClick={reset} className="text-sm px-4 py-2">Clear All</Button>
                  )}
                  
                  {status === AppStatus.PROCESSING ? (
                    <Button onClick={stopBatch} variant="secondary" className="bg-red-600 hover:bg-red-700 border-red-600 text-white">
                        Stop Processing
                    </Button>
                  ) : (
                    <Button onClick={startBatchProcessing}>
                        {batchItems.some(i => i.status === 'SUCCESS') ? 'Process Pending' : 'Start Batch'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {(status === AppStatus.PROCESSING || processedCount > 0) && (
                <div className="mb-8 animate-fade-in-up">
                  <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">
                    <span>Progress</span>
                    <span>{processedCount} of {totalFiles} processed ({totalFiles - processedCount} remaining)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden border border-gray-700 relative shadow-inner">
                     <div 
                        className="bg-gradient-to-r from-accent-pink via-purple-500 to-accent-blue h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${progressPercent}%` }}
                     >
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {progressPercent}%
                     </div>
                  </div>
                </div>
              )}

              {status !== AppStatus.PROCESSING && batchItems.some(i => i.status !== 'SUCCESS') && (
                  <div className="bg-gray-900/50 p-6 rounded-xl mb-8">
                      {renderConfiguration()}
                  </div>
              )}

              {/* Batch Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {batchItems.map((item) => (
                  <BatchImageCard key={item.id} item={item} onRetry={handleRetryItem} />
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;