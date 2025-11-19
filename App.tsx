
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import UpgradePlanner from './components/UpgradePlanner';
import VisualizationView from './components/VisualizationView';
import MyProjects from './components/MyProjects';
import Discover from './components/Discover';
import { RenovationSuggestion, Project, StoredImage, HomeAnalysis } from './types';
import * as geminiService from './services/geminiService';
import { HomeIcon, SparklesIcon, BookmarkIcon, DiamondIcon } from './components/Icons';

type Tab = 'planner' | 'visualize' | 'projects' | 'discover';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');

  const [analyses, setAnalyses] = useState<HomeAnalysis[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
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

  const handleImageUpload = async (file: File, zipCode: string) => {
    const analysisId = crypto.randomUUID();
    
    try {
      setActiveTab('planner'); // Ensure we are on planner tab

      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      const newImage: StoredImage = { id: crypto.randomUUID(), dataUrl };
      
      const newAnalysis: HomeAnalysis = {
        id: analysisId,
        image: newImage,
        zipCode: zipCode,
        suggestions: [],
        summary: '',
        state: 'loading',
        error: null,
      };

      setAnalyses(prev => [...prev, newAnalysis]);
      
      const [newSuggestions, newSummary] = await Promise.all([
        geminiService.generateSuggestions(base64, zipCode),
        geminiService.generateSummary(base64, zipCode),
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
  
  const allImages = analyses.map(a => a.image);

  const handleSaveProject = (suggestion: RenovationSuggestion, zipCode?: string) => {
    if (!projects.some(p => p.id === suggestion.id)) {
      setProjects(prev => [...prev, { ...suggestion, isSaved: true, zipCode: zipCode }]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleUploadDocument = async (file: File) => {
      try {
          const result = await geminiService.processFinancialDocument(file);
          
          // Find a project to attach this to, or create a generic one
          let targetProjectId = projects.find(p => 
              result.matchedProjectName?.toLowerCase().includes(p.name.toLowerCase()) || 
              p.name.toLowerCase().includes(result.matchedProjectName?.toLowerCase() || ''))?.id;

          if (targetProjectId) {
              setProjects(prev => prev.map(p => {
                  if (p.id === targetProjectId) {
                      return { 
                          ...p, 
                          actualCost: (p.actualCost || 0) + result.cost 
                      };
                  }
                  return p;
              }));
          } else {
              // Create a new "Custom" project from the receipt
              const newProject: Project = {
                  id: crypto.randomUUID(),
                  name: result.matchedProjectName || "Custom Expense",
                  description: result.summary,
                  avgCost: result.cost,
                  actualCost: result.cost,
                  roi: 100, 
                  category: 'General',
                  isSaved: true,
                  zipCode: analyses[0]?.zipCode // inherit default zip
              };
              setProjects(prev => [...prev, newProject]);
          }
          alert(`Processed Receipt! Added $${result.cost} to ${result.matchedProjectName || "Custom Project"}.`);
      } catch (error) {
          console.error(error);
          alert("Failed to process document. Please try again.");
      }
  };
  
  const handleVisualize = async (suggestion: RenovationSuggestion, image: StoredImage) => {
    setVisualizingSuggestion(suggestion);
    setVisualizingImage(image);
    setVisualizingSuggestionId(suggestion.id);
    setGeneratedImage(null);
    setVisualizationError(null);
    setActiveTab('visualize');

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
      setAnalyses([]);
      setProjects([]);
      setActiveTab('planner');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'planner':
        if (analyses.length === 0) {
          return <ImageUploader onImageUpload={handleImageUpload} />;
        }
        return (
          <>
            <UpgradePlanner 
              analyses={analyses} 
              projects={projects} 
              onVisualize={handleVisualize} 
              onSaveProject={handleSaveProject} 
              visualizingSuggestionId={visualizingSuggestionId} 
              onImageUpload={handleImageUpload} 
            />
            <div className="text-center mt-12 pb-8">
              <button onClick={handleReset} className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 font-bold py-2 px-6 rounded-lg transition-colors">
                  Start Over
              </button>
            </div>
          </>
        );
      case 'visualize':
        if (visualizingSuggestion && visualizingImage) {
          return (
            <VisualizationView
              originalImage={visualizingImage.dataUrl}
              generatedImage={generatedImage}
              suggestion={visualizingSuggestion}
              onBack={() => setActiveTab('planner')}
              onRetry={() => handleVisualize(visualizingSuggestion, visualizingImage)}
              error={visualizationError}
            />
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <SparklesIcon className="w-20 h-20 text-[#9CAFB7] mb-6" />
            <h2 className="text-2xl font-bold font-serif text-[#36454F]">Visualize Your Upgrades</h2>
            <p className="text-[#36454F]/70 mt-2 max-w-md mb-8">
              Select a renovation suggestion from the <strong>Planner</strong> tab to see the AI magic happen.
            </p>
            <button 
              onClick={() => setActiveTab('planner')}
              className="bg-[#5F8575] text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-[#4d6b5e] transition-colors"
            >
              Go to Planner
            </button>
          </div>
        );
      case 'projects':
        return <MyProjects projects={projects} onRemoveProject={handleRemoveProject} onUploadDocument={handleUploadDocument} />;
      case 'discover':
        return <Discover images={allImages} onGenerate={() => {}} onReset={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full text-[#36454F] bg-gray-50 overflow-hidden">
      {/* Main Container: full bleed for Discover, padded for others */}
      <main className={`pb-20 transition-all duration-300 ${activeTab === 'discover' ? 'w-full p-0 h-[100dvh]' : 'container mx-auto px-4 py-8 sm:py-12 h-auto min-h-screen'}`}>
        {renderContent()}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-center py-3 px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('planner')} 
          className={`flex flex-col items-center gap-1 w-full transition-all ${activeTab === 'planner' ? 'text-[#5F8575]' : 'text-[#36454F]/50 hover:text-[#36454F]'}`}
        >
          <HomeIcon className={`w-6 h-6 ${activeTab === 'planner' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] font-bold tracking-wide uppercase">Planner</span>
        </button>

        <button 
          onClick={() => setActiveTab('visualize')} 
          className={`flex flex-col items-center gap-1 w-full transition-all ${activeTab === 'visualize' ? 'text-[#5F8575]' : 'text-[#36454F]/50 hover:text-[#36454F]'}`}
        >
          <SparklesIcon className={`w-6 h-6 ${activeTab === 'visualize' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] font-bold tracking-wide uppercase">Visualize</span>
        </button>

        <button 
          onClick={() => setActiveTab('projects')} 
          className={`flex flex-col items-center gap-1 w-full transition-all ${activeTab === 'projects' ? 'text-[#5F8575]' : 'text-[#36454F]/50 hover:text-[#36454F]'}`}
        >
          <BookmarkIcon className={`w-6 h-6 ${activeTab === 'projects' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] font-bold tracking-wide uppercase">My Projects</span>
        </button>

        <button 
          onClick={() => setActiveTab('discover')} 
          className={`flex flex-col items-center gap-1 w-full transition-all ${activeTab === 'discover' ? 'text-[#5F8575]' : 'text-[#36454F]/50 hover:text-[#36454F]'}`}
        >
          <DiamondIcon className={`w-6 h-6 ${activeTab === 'discover' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] font-bold tracking-wide uppercase">Discover</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
