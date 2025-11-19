
import React, { useRef } from 'react';
import { HomeAnalysis, Project, StoredImage, RenovationSuggestion } from '../types';
import AnalysisResult from './AnalysisResult';
import { UploadIcon } from './Icons';

interface UpgradePlannerProps {
  analyses: HomeAnalysis[];
  projects: Project[];
  onVisualize: (suggestion: RenovationSuggestion, image: StoredImage) => void;
  onSaveProject: (suggestion: RenovationSuggestion, zipCode?: string) => void;
  visualizingSuggestionId: string | null;
  onImageUpload: (file: File, zipCode: string) => void;
}

const UpgradePlanner: React.FC<UpgradePlannerProps> = ({
  analyses,
  projects,
  onVisualize,
  onSaveProject,
  visualizingSuggestionId,
  onImageUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // For subsequent uploads, we just reuse the first analysis zip code or empty if none exists, 
    // since this button is a quick action. Ideally we'd ask again, but for MVP speed we default.
    const existingZip = analyses[0]?.zipCode || "90210"; 
    
    if (file) {
      onImageUpload(file, existingZip);
    }
    // Reset file input to allow uploading the same file again
    if(event.target) {
        event.target.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (analyses.length === 0) {
    return null; 
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#36454F]">Your Home Analyses</h1>
        <p className="text-lg text-[#36454F] opacity-80 mt-2">Review AI-powered suggestions for each of your uploaded photos.</p>
        {analyses[0]?.zipCode && (
            <span className="inline-block mt-2 px-3 py-1 bg-[#5F8575]/10 text-[#5F8575] rounded-full text-xs font-bold tracking-wider">
                LOCATION: {analyses[0].zipCode}
            </span>
        )}
      </div>

      <div className="space-y-16">
        {analyses.map(analysis => (
          <AnalysisResult
            key={analysis.id}
            analysis={analysis}
            projects={projects}
            onVisualize={onVisualize}
            onSaveProject={onSaveProject}
            visualizingSuggestionId={visualizingSuggestionId}
          />
        ))}
      </div>

      <div className="mt-16 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        <button
          onClick={handleUploadClick}
          className="inline-flex items-center gap-3 bg-white hover:bg-gray-50 border border-[#9CAFB7]/50 text-[#36454F] font-bold py-3 px-8 rounded-lg transition-colors shadow-sm"
        >
          <UploadIcon className="w-6 h-6" />
          Analyze Another Photo
        </button>
      </div>
    </div>
  );
};

export default UpgradePlanner;
