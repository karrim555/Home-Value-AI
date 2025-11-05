import React from 'react';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { BookmarkIcon } from './Icons';

interface MyProjectsProps {
  projects: Project[];
  onRemoveProject: (projectId: string) => void;
}

const MyProjects: React.FC<MyProjectsProps> = ({ projects, onRemoveProject }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center text-[#36454F] opacity-80 flex flex-col items-center justify-center p-8">
        <BookmarkIcon className="w-16 h-16 text-[#9CAFB7] mb-4" />
        <h2 className="text-3xl font-bold text-[#36454F] mb-2 font-serif">Your Saved Projects</h2>
        <p className="max-w-md">
          Once you save renovation ideas from the <span className="font-semibold text-[#9CAFB7]">Planner</span>, they'll appear here for you to review.
        </p>
      </div>
    );
  }
  
  const totalCost = projects.reduce((sum, p) => sum + p.avgCost, 0);
  const totalValueAdd = projects.reduce((sum, p) => sum + (p.avgCost * (p.roi / 100)), 0);
  const netProfit = totalValueAdd - totalCost;

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };


  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#36454F]">My Saved Projects</h1>
        <p className="text-lg text-[#36454F] opacity-80 mt-2">Here are the high-ROI ideas you've saved for your home.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 bg-white/70 p-6 rounded-2xl shadow-lg border border-white/20">
        <div className="text-center">
            <h3 className="text-sm font-semibold text-[#36454F]/70 uppercase tracking-wider">Total Estimated Cost</h3>
            <p className="text-3xl font-bold text-[#36454F] mt-1">{formatCurrency(totalCost)}</p>
        </div>
        <div className="text-center">
            <h3 className="text-sm font-semibold text-[#36454F]/70 uppercase tracking-wider">Total Potential Value Add</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(totalValueAdd)}</p>
        </div>
        <div className="text-center">
            <h3 className="text-sm font-semibold text-[#36454F]/70 uppercase tracking-wider">Net Profit Estimate</h3>
            <p className="text-3xl font-bold text-emerald-700 mt-1">{formatCurrency(netProfit)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onRemove={onRemoveProject} />
        ))}
      </div>
    </div>
  );
};

export default MyProjects;