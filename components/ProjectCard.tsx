
import React, { useState, useMemo } from 'react';
import { Project, ShoppingResult } from '../types';
import { BookmarkIcon, ShoppingBagIcon } from './Icons';
import { getFinancialGrade } from '../constants';
import { findRealProducts } from '../services/geminiService';
import Spinner from './Spinner';

interface ProjectCardProps {
    project: Project;
    onRemove: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onRemove }) => {
    const [isShopping, setIsShopping] = useState(false);
    const [shoppingResult, setShoppingResult] = useState<ShoppingResult | null>(null);
    const [isLoadingShop, setIsLoadingShop] = useState(false);

    const formatCurrency = (cost: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cost);
    };

    const gradeInfo = getFinancialGrade(project.roi);

    const handleShop = async () => {
        if (shoppingResult) {
            setIsShopping(!isShopping);
            return;
        }
        setIsShopping(true);
        setIsLoadingShop(true);
        try {
            const result = await findRealProducts(`${project.name} ${project.description}`, project.zipCode);
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
        <div className="bg-white/80 rounded-2xl p-6 flex flex-col h-full shadow-lg border border-transparent hover:border-[#9CAFB7]/30 transition-all relative overflow-hidden">
            {/* Status Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${gradeInfo.bgColor.replace('bg-', 'bg-opacity-100 bg-')}`}></div>
            
            <div className="flex justify-between items-start mb-3 mt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#36454F]/60">{project.category}</span>
                <div className={`flex items-center gap-1.5 ${gradeInfo.textColor} ${gradeInfo.bgColor} px-2.5 py-1 rounded-full text-sm font-semibold`}>
                    <span className="font-black">{gradeInfo.grade}</span>
                    <span>{gradeInfo.label}</span>
                </div>
            </div>
            
            <h3 className="text-xl font-bold font-serif text-[#36454F] mb-2">{project.name}</h3>
            <p className="text-sm text-[#36454F]/80 flex-grow mb-4 line-clamp-3">{project.description}</p>
            
            {project.rationale && (
                 <p className="text-xs italic text-[#36454F]/60 mb-4 bg-gray-50 p-2 rounded">
                    "ROI based on {project.rationale}"
                 </p>
            )}

            <div className="mt-auto space-y-3 pt-4 border-t border-[#9CAFB7]/20">
                <div className="flex justify-between text-sm">
                    <span className="text-[#36454F]/60">Est. Cost:</span>
                    <span className="font-semibold text-[#36454F]">{formatCurrency(project.avgCost)}</span>
                </div>
                
                {project.actualCost !== undefined && project.actualCost > 0 && (
                     <div className="flex justify-between text-sm">
                        <span className="text-[#36454F]/60">Actual Spent:</span>
                        <span className={`font-bold ${project.actualCost > project.avgCost ? 'text-red-500' : 'text-[#5F8575]'}`}>
                            {formatCurrency(project.actualCost)}
                        </span>
                    </div>
                )}

                {/* Shop Button */}
                <button
                    onClick={handleShop}
                    className="w-full flex items-center justify-center gap-2 bg-[#36454F] hover:bg-[#2c3942] text-white font-bold py-2 rounded-lg transition-colors text-sm"
                >
                    <ShoppingBagIcon className="w-4 h-4" />
                    {isShopping ? 'Hide Products' : 'Shop This Look'}
                </button>

                {/* Shopping Results Section */}
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
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                {shoppingResult?.text ? (
                                    <p className="text-[#36454F]/80 whitespace-pre-line">{shoppingResult.text}</p>
                                ) : (
                                    <p className="text-red-500 text-xs">Could not load products.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => onRemove(project.id)}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-[#C799A5] hover:text-[#b38692] hover:bg-[#C799A5]/10 font-semibold py-2 rounded-lg transition-colors"
                >
                    <BookmarkIcon className="w-4 h-4 fill-current text-[#C799A5]" />
                    Remove Project
                </button>
            </div>
        </div>
    );
};

export default ProjectCard;
