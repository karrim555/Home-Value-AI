
import React, { useState, useMemo } from 'react';
import { RenovationSuggestion } from '../types';
import { BookmarkIcon, SparklesIcon, ShoppingBagIcon } from './Icons';
import { getFinancialGrade } from '../constants';
import { findRealProducts } from '../services/geminiService';
import Spinner from './Spinner';

interface SuggestionCardProps {
  suggestion: RenovationSuggestion;
  onVisualize: (suggestion: RenovationSuggestion) => void;
  onSave: (suggestion: RenovationSuggestion) => void;
  isSaved: boolean;
  isVisualizing: boolean;
  zipCode?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onVisualize, onSave, isSaved, isVisualizing, zipCode }) => {
  const [isShopping, setIsShopping] = useState(false);
  const [shoppingResult, setShoppingResult] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);
  const [isLoadingShop, setIsLoadingShop] = useState(false);

  const formatCurrency = (cost: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cost);
  };
  
  const gradeInfo = getFinancialGrade(suggestion.roi);

  const handleShop = async () => {
        if (shoppingResult) {
            setIsShopping(!isShopping);
            return;
        }
        setIsShopping(true);
        setIsLoadingShop(true);
        try {
            const result = await findRealProducts(`${suggestion.name} ${suggestion.description}`, zipCode);
            setShoppingResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingShop(false);
        }
    };

    // Parse text into structured product data
    const products = useMemo(() => {
        if (!shoppingResult) return [];
        const text = shoppingResult.text;
        // Regex to find blocks of "Product: ... Price: ... Store: ..."
        // We assume the model follows the requested format.
        const items = [];
        const lines = text.split('\n');
        let currentItem: any = {};
        
        lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('product:')) {
                if (currentItem.name) items.push(currentItem);
                currentItem = { name: line.replace(/product:/i, '').trim() };
            } else if (lowerLine.includes('price:')) {
                currentItem.price = line.replace(/price:/i, '').trim();
            } else if (lowerLine.includes('store:')) {
                currentItem.store = line.replace(/store:/i, '').trim();
            }
        });
        if (currentItem.name) items.push(currentItem);
        return items;
    }, [shoppingResult]);


  return (
    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-[#36454F]/60">{suggestion.category}</span>
          <div className={`flex items-center gap-1.5 ${gradeInfo.textColor} ${gradeInfo.bgColor} px-2.5 py-1 rounded-full text-sm font-semibold`}>
            <span className="font-black">{gradeInfo.grade}</span>
            <span>{gradeInfo.label}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold font-serif text-[#36454F] my-3">{suggestion.name}</h3>
        <p className="text-[#36454F]/80 text-sm mb-4">{suggestion.description}</p>
      </div>
      <div className="pt-4 mt-auto space-y-3">
        <p className="text-lg font-semibold text-[#36454F] text-center mb-2">
          Avg. Cost: <span className="font-bold">{formatCurrency(suggestion.avgCost)}</span>
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onVisualize(suggestion)}
            disabled={isVisualizing}
            className={`flex-1 flex items-center justify-center gap-2 bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-2 px-2 rounded-lg transition-all text-sm disabled:bg-gray-400 disabled:cursor-wait ${isVisualizing ? 'animate-pulse' : ''}`}
          >
            <SparklesIcon className="w-4 h-4" />
            Visualize
          </button>
          
          <button
            onClick={handleShop}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#9CAFB7] text-[#9CAFB7] hover:bg-[#9CAFB7]/10 font-bold py-2 px-2 rounded-lg transition-colors text-sm"
          >
             <ShoppingBagIcon className="w-4 h-4" />
             Shop
          </button>

          <button
            onClick={() => onSave(suggestion)}
            disabled={isSaved}
            className={`w-10 flex items-center justify-center rounded-lg transition-colors ${
              isSaved
                ? 'bg-emerald-500 text-white cursor-not-allowed'
                : 'bg-white/80 hover:bg-white text-[#9CAFB7] border border-[#9CAFB7]/30'
            }`}
            aria-label={isSaved ? 'Saved' : 'Save Project'}
          >
            <BookmarkIcon className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Shopping Panel */}
        {isShopping && (
            <div className="mt-4 animate-fade-in">
                {isLoadingShop ? (
                    <div className="flex justify-center py-4 bg-gray-50 rounded-lg"><Spinner /></div>
                ) : products.length > 0 ? (
                    <div className="grid gap-3">
                        {products.map((prod: any, idx: number) => (
                            <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex gap-3 items-start relative overflow-hidden group hover:shadow-md transition-shadow">
                                {/* Visual Placeholder */}
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                    <ShoppingBagIcon className="w-8 h-8 opacity-50" />
                                </div>
                                
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-[#36454F] text-sm leading-tight mb-1 line-clamp-2 pr-16">{prod.name}</h4>
                                    <p className="text-xs text-[#9CAFB7] font-medium mb-2">{prod.store}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        {/* Attempt to find a link */}
                                        <a 
                                            href={shoppingResult?.sources.find(s => s.title.toLowerCase().includes(prod.store.toLowerCase()) || s.title.toLowerCase().includes(prod.name.toLowerCase().split(' ')[0]))?.uri || shoppingResult?.sources[0]?.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-[#36454F] text-white px-3 py-1.5 rounded-md font-bold hover:bg-black transition-colors"
                                        >
                                            View Item
                                        </a>
                                    </div>
                                </div>

                                {/* Price Tag Badge */}
                                <div className="absolute top-3 right-3 bg-[#5F8575] text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                    {prod.price}
                                </div>
                            </div>
                        ))}
                        
                        <div className="mt-2 text-center">
                             <p className="text-[10px] text-gray-400">Product details sourced via Google Search.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                        {shoppingResult?.text ? (
                             <p className="text-[#36454F]/80 whitespace-pre-line">{shoppingResult.text}</p>
                        ) : (
                            <p className="text-red-500 text-xs">No products found.</p>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionCard;
