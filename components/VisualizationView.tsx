import React from 'react';
import Spinner from './Spinner';
import { RenovationSuggestion } from '../types';
import ImageComparer from './ImageComparer';
import { getFinancialGrade } from '../constants';

interface VisualizationViewProps {
  originalImage: string;
  generatedImage: string | null;
  suggestion: RenovationSuggestion;
  onBack: () => void;
  onRetry: () => void;
  error: string | null;
}

const VisualizationView: React.FC<VisualizationViewProps> = ({ 
    originalImage, 
    generatedImage, 
    suggestion,
    onBack,
    onRetry,
    error,
}) => {
  const gradeInfo = getFinancialGrade(suggestion.roi);
  const valueAdd = suggestion.avgCost * (suggestion.roi / 100);
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="w-full max-w-5xl mx-auto text-center">
      <h2 className="text-3xl font-bold font-serif mb-2">Visualizing: <span className="text-[#9CAFB7]">{suggestion.name}</span></h2>
      <p className="text-lg text-[#36454F] opacity-80 mb-4 max-w-3xl mx-auto">{suggestion.description}</p>
      
      <div className={`inline-flex items-center gap-x-6 gap-y-1 flex-wrap justify-center font-bold p-3 rounded-xl mb-6 text-base ${gradeInfo.bgColor} ${gradeInfo.textColor}`}>
          <span><span className="font-black">{gradeInfo.grade}</span> {gradeInfo.bannerLabel}</span>
          <span className="opacity-90">Recouped: {suggestion.roi}%</span>
          <span className="opacity-90">Net Value: +{formatCurrency(valueAdd)}</span>
      </div>
      
      <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-white/50 border border-[#9CAFB7]/20 flex items-center justify-center text-[#9CAFB7]">
        {!generatedImage && !error && (
            <div className="text-center">
                <Spinner />
                <p className="mt-4 font-semibold text-[#36454F]/80">Generating your vision...</p>
            </div>
        )}
        {generatedImage && !error && (
            <ImageComparer before={originalImage} after={generatedImage} dividerColor={gradeInfo.dividerColor} />
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