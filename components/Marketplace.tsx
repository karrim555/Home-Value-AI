import React from 'react';
import { ProductSuggestion, RenovationSuggestion } from '../types';
import { ShoppingBagIcon } from './Icons';
import Spinner from './Spinner';

interface MarketplaceProps {
    suggestions: RenovationSuggestion[];
    products: ProductSuggestion[];
    state: 'idle' | 'loading' | 'results' | 'error';
    error: string | null;
}

const Marketplace: React.FC<MarketplaceProps> = ({ suggestions, products, state, error }) => {
    
    if (suggestions.length === 0) {
        return (
            <div className="text-center text-[#36454F] opacity-80 flex flex-col items-center justify-center p-8">
                <ShoppingBagIcon className="w-16 h-16 text-[#9CAFB7] mb-4" />
                <h2 className="text-3xl font-bold text-[#36454F] mb-2 font-serif">Your Curated Marketplace</h2>
                <p className="max-w-md">
                    Go to the <span className="font-semibold text-[#9CAFB7]">Planner</span> tab and upload a photo. The AI will suggest high-ROI projects and fill this space with recommended products.
                </p>
            </div>
        );
    }

    const uniqueProjects = [...new Set(suggestions.map(s => s.name))];

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#36454F]">Shop Your Projects</h1>
                <p className="text-lg text-[#36454F] opacity-80 mt-2">Curated products and materials to bring your vision to life.</p>
            </div>

            {state === 'loading' && products.length === 0 && (
                <div className="text-center text-[#9CAFB7]">
                    <Spinner />
                    <p className="mt-2 font-semibold text-[#36454F]/80">Loading product ideas...</p>
                </div>
            )}

            {state === 'error' && (
                <div className="text-center bg-[#C799A5]/10 border border-[#C799A5] p-8 rounded-lg max-w-lg mx-auto">
                    <h2 className="text-2xl font-semibold text-[#C799A5] font-serif">Could Not Load Products</h2>
                    <p className="text-[#C799A5] opacity-90 mt-2 mb-6">{error}</p>
                </div>
            )}

            <div className="space-y-12">
                {uniqueProjects.map(projectName => {
                    const projectProducts = products.filter(p => p.project === projectName);
                    return (
                        <div key={projectName}>
                            <h2 className="text-2xl font-bold font-serif text-[#36454F] border-b-2 border-[#9CAFB7]/30 pb-2 mb-6">{projectName}</h2>
                            {projectProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projectProducts.map(product => (
                                        <div key={product.name} className="bg-white/80 border border-transparent hover:border-[#9CAFB7]/30 rounded-2xl p-6 flex flex-col h-full transition-all duration-300 shadow-md hover:shadow-xl">
                                            <div className="flex-grow">
                                                <h3 className="text-xl font-bold text-[#36454F] font-serif mb-2">{product.name}</h3>
                                                <p className="text-[#36454F]/80 text-sm">{product.description}</p>
                                            </div>
                                            <button className="mt-6 w-full bg-[#9CAFB7] hover:bg-[#899aa1] text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                                View Product
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                state !== 'loading' && (
                                    <p className="text-center text-sm text-[#36454F]/70 py-4">No specific product suggestions available for this project yet.</p>
                                )
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Marketplace;
