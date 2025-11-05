import React from 'react';
import { RenovationSuggestion } from '../types';
import { BookmarkIcon, SparklesIcon } from './Icons';

interface SuggestionCardProps {
  suggestion: RenovationSuggestion;
  onVisualize: (suggestion: RenovationSuggestion) => void;
  onSave: (suggestion: RenovationSuggestion) => void;
  isSaved: boolean;
  isVisualizing: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onVisualize, onSave, isSaved, isVisualizing }) => {
  const formatCurrency = (cost: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cost);
  };
  
  const valueAdd = suggestion.avgCost * (suggestion.roi / 100);

  return (
    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-[#36454F]/60">{suggestion.category}</span>
          <div className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full text-sm font-semibold">
            <span>+ {formatCurrency(valueAdd)} ({suggestion.roi}% ROI)</span>
          </div>
        </div>
        <h3 className="text-xl font-bold font-serif text-[#36454F] my-3">{suggestion.name}</h3>
        <p className="text-[#36454F]/80 text-sm mb-4">{suggestion.description}</p>
      </div>
      <div className="pt-4 mt-auto">
        <p className="text-lg font-semibold text-[#36454F] text-center mb-4">
          Avg. Cost: <span className="font-bold">{formatCurrency(suggestion.avgCost)}</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onVisualize(suggestion)}
            disabled={isVisualizing}
            className={`flex-1 flex items-center justify-center gap-2 bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait ${isVisualizing ? 'animate-pulse' : ''}`}
          >
            <SparklesIcon className="w-5 h-5" />
            {isVisualizing ? 'Generating...' : 'Visualize'}
          </button>
          <button
            onClick={() => onSave(suggestion)}
            disabled={isSaved}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              isSaved
                ? 'bg-emerald-500 text-white cursor-not-allowed'
                : 'bg-white/80 hover:bg-white text-[#9CAFB7] border border-[#9CAFB7]/30'
            }`}
            aria-label={isSaved ? 'Saved' : 'Save Project'}
          >
            <BookmarkIcon className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;