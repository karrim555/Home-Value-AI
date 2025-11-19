
import React, { useState } from 'react';
import { HomeAnalysis, RenovationSuggestion, StoredImage, Project } from '../types';
import Spinner from './Spinner';
import SuggestionCard from './SuggestionCard';
import { DocumentChartBarIcon } from './Icons';

interface AnalysisResultProps {
  analysis: HomeAnalysis;
  projects: Project[];
  onVisualize: (suggestion: RenovationSuggestion, image: StoredImage) => void;
  onSaveProject: (suggestion: RenovationSuggestion, zipCode?: string) => void;
  visualizingSuggestionId: string | null;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis,
  projects,
  onVisualize,
  onSaveProject,
  visualizingSuggestionId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = analysis.summary;
  const isLongSummary = summary.length > 200;
  const truncatedSummary = isLongSummary ? `${summary.slice(0, 200)}...` : summary;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200/80">
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
              <div className="flex items-center gap-3">
                <DocumentChartBarIcon className="w-7 h-7 text-[#5F8575]" />
                <h2 className="text-2xl font-bold font-serif text-[#36454F]">Analysis Summary</h2>
              </div>
              
              <div className="text-base text-[#36454F]/90 mt-4 mb-8">
                <p>{isExpanded ? summary : truncatedSummary}</p>
                {isLongSummary && !isExpanded && (
                    <button onClick={() => setIsExpanded(true)} className="font-semibold text-[#5F8575] hover:text-[#4a6b5c] transition-colors mt-2 text-sm">
                        Continue Reading
                    </button>
                )}
              </div>
              
              <h3 className="text-xl font-bold font-serif text-[#36454F] mb-6">Top Opportunities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.suggestions.map(suggestion => {
                  const isSaved = projects.some(p => p.id === suggestion.id);
                  return (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onVisualize={(s) => onVisualize(s, analysis.image)}
                      onSave={() => onSaveProject(suggestion, analysis.zipCode)}
                      isSaved={isSaved}
                      isVisualizing={suggestion.id === visualizingSuggestionId}
                      zipCode={analysis.zipCode}
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
