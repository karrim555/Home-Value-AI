import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoredImage, FeedItem } from '../types';
import { DiamondIcon, PlayIcon } from './Icons';
import Spinner from './Spinner';
import Modal from './Modal';
import { generateInspirationFeed, generateSingleImage, generateInspirationVideo } from '../services/geminiService';

// FIX: Removed the conflicting global declaration for `window.aistudio`.
// The type is assumed to be provided by the global environment, and redeclaring it caused a TypeScript error. The `declare global` block was removed to fix this.
interface DiscoverProps {
  images: StoredImage[];
  onGenerate: () => void;
  onReset: () => void;
}

const Discover: React.FC<DiscoverProps> = ({ images, onGenerate, onReset }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [styleSummary, setStyleSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const generationTriggered = useRef(false);

  const dataUrlToBase64 = (dataUrl: string) => dataUrl.split(',')[1];

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
      return hasKey;
    }
    return false; // Fallback if aistudio is not available
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success and optimistically update UI to avoid race conditions
      setApiKeySelected(true);
    }
  };

  const generateContentForItem = useCallback(async (item: FeedItem) => {
    try {
      let contentUrl = '';
      if (item.type === 'image') {
        contentUrl = await generateSingleImage(item.prompt);
      } else if (item.type === 'video') {
        const hasKey = await checkApiKey();
        if (!hasKey) {
          throw new Error("API key required for video generation.");
        }
        contentUrl = await generateInspirationVideo(item.prompt);
      }
      
      setFeedItems(prevItems => prevItems.map(i => 
        i.id === item.id ? { ...i, contentUrl, status: 'complete' } : i
      ));
    } catch (err) {
      console.error(`Failed to generate content for item ${item.id}:`, err);
       if (err instanceof Error && err.message.includes("API key is not valid")) {
          // Reset key state if server confirms it's bad
          setApiKeySelected(false);
       }
      setFeedItems(prevItems => prevItems.map(i => 
        i.id === item.id ? { ...i, status: 'error' } : i
      ));
    }
  }, [checkApiKey]);
  
  const handleGenerateClick = () => {
    if (generationTriggered.current || isLoading) return;
    generationTriggered.current = true;
    
    setIsLoading(true);
    setError(null);

    const imagesBase64 = images.map(img => dataUrlToBase64(img.dataUrl));
    generateInspirationFeed(imagesBase64)
      .then(result => {
        setThemes(result.themes);
        setStyleSummary(result.styleSummary);
        const newFeedItems: FeedItem[] = result.initialFeed.map(item => ({
          id: crypto.randomUUID(),
          type: item.type,
          prompt: item.prompt,
          contentUrl: '',
          status: 'pending'
        }));
        setFeedItems(newFeedItems);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const itemsToProcess = feedItems.filter(item => item.status === 'pending');
    if (itemsToProcess.length > 0) {
      setFeedItems(prev => prev.map(item => item.status === 'pending' ? {...item, status: 'generating'} : item));
      itemsToProcess.forEach(item => generateContentForItem(item));
    }
  }, [feedItems, generateContentForItem]);
  
  if (images.length === 0) {
    return (
      <div className="text-center text-[#36454F] opacity-80 flex flex-col items-center justify-center p-8">
        <DiamondIcon className="w-16 h-16 text-[#9CAFB7] mb-4" />
        <h2 className="text-3xl font-bold text-[#36454F] mb-2 font-serif">Create Your Moodboard</h2>
        <p className="max-w-md">
          Go to the <span className="font-semibold text-[#9CAFB7]">Planner</span> tab to upload photos of your space. Then, come back here to generate an AI-powered design feed!
        </p>
      </div>
    );
  }

  if (isLoading) {
      return (
        <div className="text-center text-[#9CAFB7]">
          <Spinner />
          <h2 className="text-2xl font-semibold mt-4 text-[#36454F] font-serif">Generating your inspiration...</h2>
          <p className="text-[#36454F] opacity-80 mt-2">The AI is crafting a personalized feed for you.</p>
        </div>
      );
  }

  if (error) {
     return (
        <div className="text-center bg-[#C799A5]/10 border border-[#C799A5] p-8 rounded-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-[#C799A5] font-serif">An Error Occurred</h2>
            <p className="text-[#C799A5] opacity-90 mt-2 mb-6">{error}</p>
            <button
                onClick={handleGenerateClick}
                className="bg-[#C799A5] hover:bg-opacity-80 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Try Again
            </button>
        </div>
    );
  }

  if (feedItems.length > 0) {
    return (
      <div className="w-full">
        <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#36454F]">Your Design Inspiration</h2>
             {styleSummary && (
                <p className="max-w-2xl mx-auto mt-4 text-[#36454F]/80 bg-[#9CAFB7]/10 p-4 rounded-xl text-md">
                    <strong>Why this style?</strong> {styleSummary}
                </p>
            )}
             <div className="flex flex-wrap justify-center gap-2 mt-4">
                {themes.map((theme, index) => (
                    <span key={index} className="bg-[#9CAFB7]/20 text-[#36454F] font-medium text-sm px-3 py-1.5 rounded-full">
                        {theme}
                    </span>
                ))}
            </div>
        </div>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {feedItems.map(item => (
                <div key={item.id} className="break-inside-avoid rounded-lg overflow-hidden shadow-lg cursor-pointer relative bg-gray-200" onClick={() => item.status === 'complete' && setSelectedItem(item)}>
                    {item.status === 'generating' && (
                        <div className="w-full aspect-[9/16] flex flex-col items-center justify-center text-gray-500">
                           <Spinner />
                           <span className="text-xs mt-2">Generating...</span>
                        </div>
                    )}
                    {item.status === 'error' && (
                        <div className="w-full aspect-[9/16] flex items-center justify-center bg-red-100 text-red-600 text-xs p-2">
                            Generation failed.
                        </div>
                    )}
                    {item.status === 'complete' && (
                        <>
                          {item.type === 'image' && <img src={item.contentUrl} alt={item.prompt} className="w-full h-auto object-cover" />}
                          {item.type === 'video' && (
                            <div className="relative">
                              <video src={item.contentUrl} className="w-full h-auto object-cover" muted playsInline loop />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <PlayIcon className="w-12 h-12 text-white/80" />
                              </div>
                            </div>
                          )}
                        </>
                    )}
                </div>
            ))}
        </div>
        {selectedItem && <Modal item={selectedItem} onClose={() => setSelectedItem(null)} />}
         <div className="text-center mt-12">
            <button
              onClick={onReset}
              className="bg-white border border-[#9CAFB7] text-[#9CAFB7] hover:bg-[#9CAFB7]/10 font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Start Over
            </button>
         </div>
      </div>
    );
  }

  // Default state: idle with images
  return (
    <div className="w-full text-center">
        <h2 className="text-3xl font-bold text-center mb-2 font-serif">Ready to Discover?</h2>
        <p className="text-lg text-[#36454F] opacity-80 text-center mb-8">
          The AI will analyze your photos to create a personalized inspiration feed.
        </p>
        <div className="flex justify-center flex-wrap gap-4 max-w-3xl mx-auto mb-8">
            {images.map(image => (
                <img key={image.id} src={image.dataUrl} alt="Uploaded space" className="w-24 h-24 object-cover rounded-lg shadow-md" />
            ))}
        </div>
        {!apiKeySelected && (
            <div className="max-w-2xl mx-auto bg-[#9CAFB7]/10 p-4 rounded-lg text-center mb-6">
                <p className="font-semibold text-[#36454F]">API Key Required for Video</p>
                <p className="text-sm text-[#36454F]/80 mb-3">To generate video inspiration, please select your API key. You can find more information about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                <button onClick={handleOpenApiKeyDialog} className="bg-[#9CAFB7] text-white font-bold py-2 px-4 rounded-lg text-sm">Select API Key</button>
            </div>
        )}
        <button
            onClick={handleGenerateClick}
            className="bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
        >
            Generate Inspiration Feed
        </button>
    </div>
  )
};

export default Discover;