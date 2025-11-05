import React, { useRef } from 'react';
import { HomeAnalysis, Project, StoredImage, RenovationSuggestion } from '../types';
import AnalysisResult from './AnalysisResult';
import { UploadIcon } from './Icons';

interface UpgradePlannerProps {
  analyses: HomeAnalysis[];
  projects: Project[];
  onVisualize: (suggestion: RenovationSuggestion, image: StoredImage) => void;
  onSaveProject: (suggestion: RenovationSuggestion) => void;
  visualizingSuggestionId: string | null;
  onImageUpload: (file: File) => void;
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
    if (file) {
      onImageUpload(file);
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
    return (
        <div className="text-center text-[#36454F] opacity-80 flex flex-col items-center justify-center p-8">
            <h2 className="text-3xl font-bold text-[#36454F] mb-4 font-serif">Your Home Analyses</h2>
            <p className="max-w-md mb-8">
            Upload a photo to get started. The AI will analyze your space and suggest high-ROI upgrades.
            </p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
            <button
                onClick={handleUploadClick}
                className="inline-flex items-center gap-3 bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
            >
                <UploadIcon className="w-6 h-6" />
                Analyze First Photo
            </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#36454F]">Your Home Analyses</h1>
        <p className="text-lg text-[#36454F] opacity-80 mt-2">Review AI-powered suggestions for each of your uploaded photos.</p>
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