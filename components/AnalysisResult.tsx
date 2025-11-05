import React from 'react';
import { HomeAnalysis, RenovationSuggestion, StoredImage, Project } from '../types';
import Spinner from './Spinner';
import SuggestionCard from './SuggestionCard';

interface AnalysisResultProps {
  analysis: HomeAnalysis;
  projects: Project[];
  onVisualize: (suggestion: RenovationSuggestion, image: StoredImage) => void;
  onSaveProject: (suggestion: RenovationSuggestion) => void;
  visualizingSuggestionId: string | null;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis,
  projects,
  onVisualize,
  onSaveProject,
  visualizingSuggestionId
}) => {
  return (
    <div className="bg-white/50 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-white/30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <img src={analysis.image.dataUrl} alt="Analyzed home" className="w-full h-auto object-cover rounded-xl shadow-lg" />
        </div>
        <div className="lg:col-span-2">
          {analysis.state === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full text-[#9CAFB7]">
              <Spinner />
              <h2 className="text-xl font-semibold mt-4 text-[#36454F] font-serif">Analyzing...</h2>
            </div>
          )}
          {analysis.state === 'error' && (
            <div className="flex flex-col items-center justify-center h-full text-center bg-[#C799A5]/10 border border-[#C799A5] p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-[#C799A5] font-serif">Analysis Failed</h2>
              <p className="text-[#C799A5] opacity-90 mt-2">{analysis.error}</p>
            </div>
          )}
          {analysis.state === 'results' && (
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#36454F]">Analysis Summary</h2>
              <p className="text-base text-[#36454F] opacity-80 mt-2 mb-8 bg-[#9CAFB7]/10 p-4 rounded-xl">{analysis.summary}</p>
              
              <h3 className="text-xl font-bold font-serif text-[#36454F] mb-6">Top Opportunities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.suggestions.map(suggestion => {
                  const isSaved = projects.some(p => p.id === suggestion.id);
                  return (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onVisualize={(s) => onVisualize(s, analysis.image)}
                      onSave={onSaveProject}
                      isSaved={isSaved}
                      isVisualizing={suggestion.id === visualizingSuggestionId}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
