import React from 'react';
import Spinner from './Spinner';
import { RenovationSuggestion } from '../types';
import ImageComparer from './ImageComparer';

interface VisualizationViewProps {
  originalImage: string;
  generatedImage: string | null;
  suggestion: RenovationSuggestion;
  onBack: () => void;
  onRetry: () => void;
  error: string | null;
}

const getRoiGrade = (roi: number): { grade: string; color: string } => {
  if (roi >= 150) return { grade: 'A+', color: 'text-emerald-500' };
  if (roi >= 120) return { grade: 'A', color: 'text-emerald-500' };
  if (roi >= 100) return { grade: 'B+', color: 'text-green-500' };
  if (roi >= 80) return { grade: 'B', color: 'text-lime-500' };
  if (roi >= 60) return { grade: 'C+', color: 'text-yellow-500' };
  return { grade: 'C', color: 'text-amber-500' };
};


const VisualizationView: React.FC<VisualizationViewProps> = ({ 
    originalImage, 
    generatedImage, 
    suggestion,
    onBack,
    onRetry,
    error,
}) => {
  const roiGrade = getRoiGrade(suggestion.roi);
  return (
    <div className="w-full max-w-5xl mx-auto text-center">
      <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mb-2">
        <h2 className="text-3xl font-bold font-serif">Visualizing: <span className="text-[#9CAFB7]">{suggestion.name}</span></h2>
        <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${roiGrade.color} bg-opacity-10 bg-current`}>
            ROI Impact: {roiGrade.grade}
        </div>
      </div>
      <p className="text-lg text-[#36454F] opacity-80 mb-8">{suggestion.description}</p>
      
      <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-white/50 border border-[#9CAFB7]/20 flex items-center justify-center text-[#9CAFB7]">
        {!generatedImage && !error && (
            <div className="text-center">
                <Spinner />
                <p className="mt-4 font-semibold text-[#36454F]/80">Generating your vision...</p>
            </div>
        )}
        {generatedImage && !error && (
            <ImageComparer before={originalImage} after={generatedImage} />
        )}
        {error && (
            <div className="p-4 text-center">
                <p className="text-[#C799A5] mb-4">{error}</p>
                <button
                    onClick={onRetry}
                    className="bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-2 px-4 rounded-lg"
                >
                    Retry
                </button>
            </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="bg-white border border-[#9CAFB7] text-[#9CAFB7] hover:bg-[#9CAFB7]/10 font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Back to Suggestions
        </button>
      </div>
    </div>
  );
};

export default VisualizationView;