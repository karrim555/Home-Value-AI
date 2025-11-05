import React from 'react';
import { Project } from '../types';
import { BookmarkIcon } from './Icons';

interface ProjectCardProps {
    project: Project;
    onRemove: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onRemove }) => {
    const formatCurrency = (cost: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cost);
    };

    const valueAdd = project.avgCost * (project.roi / 100);

    return (
        <div className="bg-white/80 rounded-2xl p-6 flex flex-col h-full shadow-lg border border-transparent hover:border-[#9CAFB7]/30 transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#36454F]/60">{project.category}</span>
                <div className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full text-sm font-semibold">
                    <span>+ {formatCurrency(valueAdd)} ({project.roi}% ROI)</span>
                </div>
            </div>
            <h3 className="text-xl font-bold font-serif text-[#36454F] mb-2">{project.name}</h3>
            <p className="text-sm text-[#36454F]/80 flex-grow mb-4">{project.description}</p>
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-[#9CAFB7]/20">
                <span className="font-semibold text-[#36454F]">{formatCurrency(project.avgCost)}</span>
                <button
                    onClick={() => onRemove(project.id)}
                    className="flex items-center gap-1.5 text-sm text-[#C799A5] hover:text-[#b38692] font-semibold"
                >
                    <BookmarkIcon className="w-5 h-5 fill-current text-[#C799A5]" />
                    Remove
                </button>
            </div>
        </div>
    );
};

export default ProjectCard;
