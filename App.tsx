import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import UpgradePlanner from './components/UpgradePlanner';
import VisualizationView from './components/VisualizationView';
import MyProjects from './components/MyProjects';
import Marketplace from './components/Marketplace';
import Discover from './components/Discover';
import { RenovationSuggestion, Project, ProductSuggestion, StoredImage, HomeAnalysis } from './types';
import * as geminiService from './services/geminiService';

type View = 'upload' | 'planner' | 'visualize';
type Tab = 'planner' | 'projects' | 'marketplace' | 'discover';

function App() {
  const [view, setView] = useState<View>('upload');
  const [activeTab, setActiveTab] = useState<Tab>('planner');

  const [analyses, setAnalyses] = useState<HomeAnalysis[]>([]);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<ProductSuggestion[]>([]);

  const [marketplaceState, setMarketplaceState] = useState<'idle' | 'loading' | 'results' | 'error'>('idle');

  const [visualizingSuggestion, setVisualizingSuggestion] = useState<RenovationSuggestion | null>(null);
  const [visualizingImage, setVisualizingImage] = useState<StoredImage | null>(null);
  const [visualizingSuggestionId, setVisualizingSuggestionId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [visualizationError, setVisualizationError] = useState<string | null>(null);


  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const handleImageUpload = async (file: File) => {
    const analysisId = crypto.randomUUID();
    
    try {
      if (view === 'upload') {
        setView('planner');
      }

      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      const newImage: StoredImage = { id: crypto.randomUUID(), dataUrl };
      
      const newAnalysis: HomeAnalysis = {
        id: analysisId,
        image: newImage,
        suggestions: [],
        summary: '',
        state: 'loading',
        error: null,
      };

      setAnalyses(prev => [...prev, newAnalysis]);
      
      const [newSuggestions, newSummary] = await Promise.all([
        geminiService.generateSuggestions(base64),
        geminiService.generateSummary(base64),
      ]);
      
      const suggestionsWithIds = newSuggestions.map(s => ({ ...s, id: crypto.randomUUID() }));
      
      setAnalyses(prev => prev.map(a => a.id === analysisId 
        ? { ...a, suggestions: suggestionsWithIds, summary: newSummary, state: 'results' } 
        : a
      ));

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setAnalyses(prev => prev.map(a => a.id === analysisId 
        ? { ...a, state: 'error', error: errorMessage } 
        : a
      ).filter(Boolean) as HomeAnalysis[]);
    }
  };
  
  const allSuggestions = analyses.flatMap(a => a.suggestions);
  const allImages = analyses.map(a => a.image);

  const fetchProducts = useCallback(async () => {
    if (allSuggestions.length > 0 && products.length === 0 && marketplaceState === 'idle') {
      setMarketplaceState('loading');
      try {
        const productPromises = allSuggestions.map(suggestion =>
          geminiService.generateProductSuggestions(suggestion.name).then(prods =>
            prods.map(p => ({ ...p, project: suggestion.name }))
          )
        );
        const productResults = await Promise.all(productPromises);
        setProducts(productResults.flat());
        setMarketplaceState('results');
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setMarketplaceState('error');
      }
    }
  }, [allSuggestions, products.length, marketplaceState]);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  const handleSaveProject = (suggestion: RenovationSuggestion) => {
    if (!projects.some(p => p.id === suggestion.id)) {
      setProjects(prev => [...prev, { ...suggestion, isSaved: true }]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };
  
  const handleVisualize = async (suggestion: RenovationSuggestion, image: StoredImage) => {
    setVisualizingSuggestion(suggestion);
    setVisualizingImage(image);
    setVisualizingSuggestionId(suggestion.id);
    setGeneratedImage(null);
    setVisualizationError(null);
    setView('visualize');

    try {
      const originalImageDataUrl = image.dataUrl;
      const mimeTypeMatch = originalImageDataUrl.match(/:(.*?);/);
      if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
          throw new Error("Could not determine image mime type.");
      }
      const mimeType = mimeTypeMatch[1];
      const base64 = originalImageDataUrl.split(',')[1];
      
      const prompt = `Apply the following renovation to this image: "${suggestion.name} - ${suggestion.description}". Keep the rest of the image the same.`;
      
      const resultImage = await geminiService.generateEditedImage(base64, mimeType, prompt);
      setGeneratedImage(resultImage);
    } catch (err) {
        setVisualizationError(err instanceof Error ? err.message : "Failed to generate edited image.");
    } finally {
        setVisualizingSuggestionId(null);
    }
  };
  
  const handleReset = () => {
      setView('upload');
      setAnalyses([]);
      setProjects([]);
      setProducts([]);
      setMarketplaceState('idle');
      setActiveTab('planner');
  };

  const renderContent = () => {
    if (view === 'upload') {
      return <ImageUploader onImageUpload={handleImageUpload} />;
    }

    if (view === 'visualize' && visualizingSuggestion && visualizingImage) {
      return (
        <VisualizationView
          originalImage={visualizingImage.dataUrl}
          generatedImage={generatedImage}
          suggestion={visualizingSuggestion}
          onBack={() => setView('planner')}
          onRetry={() => handleVisualize(visualizingSuggestion, visualizingImage)}
          error={visualizationError}
        />
      );
    }

    // Main tabbed view
    return (
      <div className="w-full">
        <div className="flex justify-center mb-8 border-b border-[#9CAFB7]/20">
          <nav className="flex gap-4 sm:gap-8 -mb-px">
            {(['planner', 'projects', 'marketplace', 'discover'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 text-sm sm:text-base font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#36454F] text-[#36454F]'
                    : 'border-transparent text-[#36454F]/60 hover:text-[#36454F]'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="w-full">
          {activeTab === 'planner' && <UpgradePlanner analyses={analyses} projects={projects} onVisualize={handleVisualize} onSaveProject={handleSaveProject} visualizingSuggestionId={visualizingSuggestionId} onImageUpload={handleImageUpload} />}
          {activeTab === 'projects' && <MyProjects projects={projects} onRemoveProject={handleRemoveProject} />}
          {activeTab === 'marketplace' && <Marketplace suggestions={allSuggestions} products={products} state={marketplaceState} error={marketplaceState === 'error' ? "Failed to load products." : null} />}
          {activeTab === 'discover' && <Discover images={allImages} onGenerate={() => {}} onReset={handleReset} />}
        </div>
        {activeTab !== 'discover' && analyses.length > 0 && (
             <div className="text-center mt-12">
                <button onClick={handleReset} className="bg-white border border-[#9CAFB7] text-[#9CAFB7] hover:bg-[#9CAFB7]/10 font-bold py-2 px-6 rounded-lg transition-colors">
                    Start Over
                </button>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E0E8F0] to-[#F5F7FA] text-[#36454F]">
      <main className="container mx-auto px-4 py-8 sm:py-16 flex flex-col items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;