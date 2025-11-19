
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoredImage, FeedItem } from '../types';
import { DiamondIcon, PlayIcon, HeartIcon, ChatBubbleIcon, PaperAirplaneIcon, CloseIcon } from './Icons';
import Spinner from './Spinner';
import { generateInspirationFeed, generateSingleImage, generateInspirationVideo, extractStyleFromVideo } from '../services/geminiService';

interface DiscoverProps {
  images: StoredImage[];
  onGenerate: () => void;
  onReset: () => void;
}

interface Comment {
  user: string;
  text: string;
}

interface FeedPostProps {
    item: FeedItem;
}

const MOCK_COMMENTS = [
    "This is exactly what I was looking for! 😍",
    "Love the lighting in this one.",
    "Where can I get those fixtures?",
    "Such a clean and modern vibe.",
    "Saving this for my renovation.",
    "Can you do this in a darker tone?",
    "Obsessed! ✨",
    "This layout is perfect."
];

const getRandomComments = () => {
    const count = Math.floor(Math.random() * 3) + 1;
    const comments = [];
    for(let i=0; i<count; i++) {
        comments.push({
            user: `user_${Math.floor(Math.random() * 1000)}`,
            text: MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)]
        });
    }
    return comments;
};

const FeedPost: React.FC<FeedPostProps> = ({ item }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100) + 10);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        setComments(getRandomComments());
    }, []);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setComments(prev => [...prev, { user: 'You', text: newComment }]);
        setNewComment("");
    };

    return (
        <div className="relative w-full h-full snap-start flex items-center justify-center bg-black text-white overflow-hidden">
             {/* Content Layer */}
            <div className="absolute inset-0 flex items-center justify-center">
                {item.status === 'generating' && (
                    <div className="flex flex-col items-center justify-center text-white/70">
                        <Spinner />
                        <p className="mt-4 text-sm font-medium animate-pulse">Dreaming up your design...</p>
                    </div>
                )}
                {item.status === 'error' && (
                     <div className="text-red-400 text-center px-4">
                        <p>Could not load this idea.</p>
                     </div>
                )}
                {item.status === 'complete' && (
                    <>
                        {/* Blurred Background for Aspect Ratio Fill */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 scale-110"
                            style={{ backgroundImage: `url(${item.contentUrl})` }}
                        ></div>
                        
                        {item.type === 'image' && (
                            <img src={item.contentUrl} alt={item.prompt} className="relative z-10 w-full h-full object-cover" />
                        )}
                        {item.type === 'video' && (
                             <video 
                                src={item.contentUrl} 
                                className="relative z-10 w-full h-full object-cover" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                             />
                        )}
                    </>
                )}
            </div>

             {/* Overlay Gradient */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none z-20"></div>

             {/* Right Action Bar */}
             <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30 pb-4">
                 <div className="flex flex-col items-center gap-1">
                     <button onClick={handleLike} className="transition-transform active:scale-75">
                         <HeartIcon className={`w-8 h-8 drop-shadow-md ${isLiked ? 'text-red-500 fill-current' : 'text-white'}`} filled={isLiked} />
                     </button>
                     <span className="text-xs font-semibold drop-shadow-md">{likeCount}</span>
                 </div>

                 <div className="flex flex-col items-center gap-1">
                     <button onClick={() => setShowComments(true)} className="transition-transform active:scale-75">
                         <ChatBubbleIcon className="w-8 h-8 text-white drop-shadow-md" />
                     </button>
                     <span className="text-xs font-semibold drop-shadow-md">{comments.length}</span>
                 </div>
                 
                 <div className="flex flex-col items-center gap-1">
                    <PaperAirplaneIcon className="w-7 h-7 text-white drop-shadow-md -rotate-45 translate-x-1 translate-y-[-2px]" />
                 </div>
             </div>

             {/* Bottom Info */}
             <div className="absolute left-0 bottom-0 right-16 p-4 z-30 text-left pb-6">
                 <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5F8575] to-[#9CAFB7] flex items-center justify-center text-xs font-bold">AI</div>
                     <span className="font-bold text-sm drop-shadow-md">HomeAI Designer</span>
                 </div>
                 <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md leading-snug">
                     {item.prompt}
                 </p>
             </div>

             {/* Comments Drawer */}
             {showComments && (
                 <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex flex-col justify-end animate-fade-in">
                     <div 
                        className="absolute inset-0" 
                        onClick={() => setShowComments(false)}
                     ></div>
                     <div className="bg-white text-[#36454F] rounded-t-2xl h-[60%] flex flex-col w-full relative animate-slide-up shadow-2xl">
                         <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
                         <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-100">
                             <h3 className="font-bold text-sm">Comments</h3>
                             <button onClick={() => setShowComments(false)}><CloseIcon className="w-6 h-6 text-gray-400" /></button>
                         </div>
                         
                         <div className="flex-grow overflow-y-auto p-4 space-y-4">
                             {comments.map((c, i) => (
                                 <div key={i} className="flex gap-3 text-sm">
                                     <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-500 uppercase">
                                         {c.user.substring(0, 2)}
                                     </div>
                                     <div>
                                         <span className="font-bold mr-2 text-xs">{c.user}</span>
                                         <span className="text-gray-700">{c.text}</span>
                                     </div>
                                 </div>
                             ))}
                             {comments.length === 0 && (
                                 <p className="text-center text-gray-400 text-sm py-8">No comments yet. Be the first!</p>
                             )}
                         </div>

                         <form onSubmit={handleAddComment} className="p-3 border-t border-gray-100 flex gap-2 items-center">
                             <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..." 
                                className="flex-grow bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5F8575]/20"
                             />
                             <button type="submit" disabled={!newComment.trim()} className="text-[#5F8575] font-bold text-sm disabled:opacity-50 p-2">
                                 Post
                             </button>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

const Discover: React.FC<DiscoverProps> = ({ images, onGenerate, onReset }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [styleSummary, setStyleSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedStyle, setExtractedStyle] = useState<string | null>(null);
  
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const generationTriggered = useRef(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const dataUrlToBase64 = (dataUrl: string) => dataUrl.split(',')[1];

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
      return hasKey;
    }
    return false; 
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsLoading(true);
          try {
              const styleDesc = await extractStyleFromVideo(file);
              setExtractedStyle(styleDesc);
              alert("Video Style Extracted! We will use this 'Vibe' for your inspiration feed.");
          } catch (err) {
              console.error(err);
              alert("Failed to analyze video style.");
          } finally {
              setIsLoading(false);
          }
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
    
    generateInspirationFeed(imagesBase64, extractedStyle || undefined)
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
  
  // 1. EMPTY STATE
  if (images.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center h-[80vh]">
        <DiamondIcon className="w-16 h-16 text-[#9CAFB7] mb-4" />
        <h2 className="text-3xl font-bold text-[#36454F] mb-2 font-serif">Create Your Moodboard</h2>
        <p className="max-w-md text-[#36454F]/70 mb-6">
          Go to the <span className="font-semibold text-[#9CAFB7]">Planner</span> tab to upload photos of your space. Then, come back here to generate an AI-powered design feed!
        </p>
      </div>
    );
  }

  // 2. LOADING STATE (Initial Analysis)
  if (isLoading && feedItems.length === 0) {
      return (
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center h-[80vh] text-center text-[#9CAFB7]">
          <Spinner />
          <h2 className="text-2xl font-semibold mt-4 text-[#36454F] font-serif">Thinking like a Designer...</h2>
          <p className="text-[#36454F]/70 mt-2">Analyzing style, matching vibes, and generating content.</p>
        </div>
      );
  }

  // 3. FEED VIEW (Instagram Reels Style)
  if (feedItems.length > 0) {
    return (
      <div className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
          {feedItems.map(item => (
              <FeedPost key={item.id} item={item} />
          ))}
          
          {/* Footer in Feed */}
          <div className="snap-start w-full h-64 bg-gray-900 flex flex-col items-center justify-center text-white/50 p-8 gap-4">
              <DiamondIcon className="w-10 h-10 opacity-50" />
              <p className="text-sm">You've reached the end.</p>
              <button
                onClick={onReset}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-full transition-colors text-sm"
              >
                Start Over
              </button>
          </div>
      </div>
    );
  }

  // 4. INTRO / SETUP STATE
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-center mb-2 font-serif text-[#36454F]">Ready to Discover?</h2>
        <p className="text-lg text-[#36454F]/80 text-center mb-8 max-w-md">
          The AI will analyze your photos to create a personalized inspiration feed, styled just for you.
        </p>
        
        <div className="flex justify-center flex-wrap gap-2 max-w-3xl mx-auto mb-8">
            {images.map(image => (
                <img key={image.id} src={image.dataUrl} alt="Uploaded space" className="w-20 h-20 object-cover rounded-lg shadow-sm border-2 border-white" />
            ))}
        </div>

        <div className="w-full max-w-md mb-8 p-6 border border-dashed border-[#9CAFB7] rounded-2xl bg-[#9CAFB7]/5 text-center">
            <h3 className="font-bold text-[#36454F] mb-2">Advanced: "Vibe Coding" Match</h3>
            <p className="text-sm text-[#36454F]/70 mb-4">Upload a video walkthrough of a home you love. We'll extract the style.</p>
            <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/mp4,video/quicktime" />
            <button 
                onClick={() => videoInputRef.current?.click()}
                className="bg-white border border-[#9CAFB7] text-[#36454F] text-sm font-bold py-2 px-4 rounded-lg hover:bg-[#9CAFB7] hover:text-white transition-colors shadow-sm"
            >
                {extractedStyle ? "Video Style Added! ✓" : "Upload Reference Video"}
            </button>
            {extractedStyle && <p className="text-xs text-[#5F8575] mt-2 italic">Style tokens extracted.</p>}
        </div>

        {!apiKeySelected && (
            <div className="w-full max-w-md bg-orange-50 border border-orange-100 p-4 rounded-lg text-center mb-6">
                <p className="font-semibold text-orange-800 text-sm">API Key Required for Videos</p>
                <p className="text-xs text-orange-800/70 mb-3">To enable video generation in your feed, please select your key.</p>
                <button onClick={handleOpenApiKeyDialog} className="bg-orange-200 hover:bg-orange-300 text-orange-900 font-bold py-2 px-4 rounded-lg text-xs transition-colors">Select API Key</button>
            </div>
        )}
        
        <button
            onClick={handleGenerateClick}
            className="bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg flex items-center gap-2"
        >
            <SparklesIcon className="w-6 h-6" />
            Generate Feed
        </button>

        <div className="mt-4 text-center">
             <button onClick={onReset} className="text-sm text-gray-400 hover:text-gray-600 underline">
                 Clear Data
             </button>
        </div>
    </div>
  );
};

// Helper for icon usage inside component
const SparklesIcon: React.FC<any> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

export default Discover;
