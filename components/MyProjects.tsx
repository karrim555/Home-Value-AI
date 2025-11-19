
import React, { useRef, useState } from 'react';
import { Project, RenovationPlan } from '../types';
import ProjectCard from './ProjectCard';
import { BookmarkIcon, DocumentChartBarIcon, SparklesIcon } from './Icons';
import { generateRenovationPlan } from '../services/geminiService';
import Spinner from './Spinner';

interface MyProjectsProps {
  projects: Project[];
  onRemoveProject: (projectId: string) => void;
  onUploadDocument: (file: File) => void;
}

const MyProjects: React.FC<MyProjectsProps> = ({ projects, onRemoveProject, onUploadDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<RenovationPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onUploadDocument(e.target.files[0]);
      }
  };

  const handleGeneratePlan = async () => {
      setIsGeneratingPlan(true);
      try {
          const newPlan = await generateRenovationPlan(projects);
          setPlan(newPlan);
      } catch (e) {
          console.error(e);
          alert("Could not generate plan.");
      } finally {
          setIsGeneratingPlan(false);
      }
  };

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
  
  const estimatedCost = projects.reduce((sum, p) => sum + p.avgCost, 0);
  const actualCostTotal = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  const totalValueAdd = projects.reduce((sum, p) => sum + (p.avgCost * (p.roi / 100)), 0);
  const projectedNetProfit = totalValueAdd - (actualCostTotal > 0 ? actualCostTotal : estimatedCost);

  const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };


  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#36454F]">My Saved Projects</h1>
        <p className="text-lg text-[#36454F] opacity-80 mt-2">Manage your renovations and track real costs.</p>
      </div>
      
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 bg-white/70 p-6 rounded-2xl shadow-lg border border-white/20">
        <div className="text-center">
            <h3 className="text-xs font-bold text-[#36454F]/70 uppercase tracking-wider">Estimated Cost</h3>
            <p className="text-2xl font-bold text-[#36454F] mt-1">{formatCurrency(estimatedCost)}</p>
        </div>
        <div className="text-center border-l border-gray-200/50">
            <h3 className="text-xs font-bold text-[#36454F]/70 uppercase tracking-wider">Actual Spend</h3>
            <p className={`text-2xl font-bold mt-1 ${actualCostTotal > estimatedCost ? 'text-red-500' : 'text-[#5F8575]'}`}>
                {formatCurrency(actualCostTotal)}
            </p>
        </div>
        <div className="text-center border-l border-gray-200/50">
            <h3 className="text-xs font-bold text-[#36454F]/70 uppercase tracking-wider">Potential Value</h3>
            <p className="text-2xl font-bold text-[#5F8575] mt-1">{formatCurrency(totalValueAdd)}</p>
        </div>
        <div className="text-center border-l border-gray-200/50">
            <h3 className="text-xs font-bold text-[#36454F]/70 uppercase tracking-wider">Net Profit</h3>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(projectedNetProfit)}</p>
        </div>
      </div>

      {/* Actions Bar: Upload & Generate Plan */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Receipt */}
          <div className="p-6 border-2 border-dashed border-[#9CAFB7]/40 rounded-xl bg-[#9CAFB7]/5 flex items-center justify-between gap-4">
             <div>
                 <h3 className="font-bold text-[#36454F] flex items-center gap-2"><DocumentChartBarIcon className="w-5 h-5 text-[#5F8575]"/> Track Spend</h3>
                 <p className="text-sm text-[#36454F]/70">Upload receipt/bid to auto-update costs.</p>
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
             <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-[#9CAFB7] text-[#36454F] text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[#5F8575] hover:text-white transition-colors">Upload</button>
          </div>

          {/* Generate Plan */}
          <div className="p-6 border border-[#5F8575]/20 rounded-xl bg-[#5F8575]/5 flex items-center justify-between gap-4">
              <div>
                  <h3 className="font-bold text-[#36454F] flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-[#5F8575]"/> AI Project Manager</h3>
                  <p className="text-sm text-[#36454F]/70">Generate a step-by-step execution timeline.</p>
              </div>
              <button 
                onClick={handleGeneratePlan} 
                disabled={isGeneratingPlan}
                className="bg-[#5F8575] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[#4d6b5e] transition-colors disabled:opacity-50"
              >
                  {isGeneratingPlan ? 'Thinking...' : 'Create Plan'}
              </button>
          </div>
      </div>

      {/* Timeline Display */}
      {plan && (
          <div className="mb-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-fade-in">
              <h2 className="text-2xl font-serif font-bold text-[#36454F] mb-2">Renovation Timeline</h2>
              <p className="text-[#36454F]/70 mb-6">{plan.advice}</p>
              
              <div className="relative border-l-2 border-[#9CAFB7]/30 ml-4 space-y-8">
                  {plan.phases.map((phase, idx) => (
                      <div key={idx} className="relative pl-8">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#5F8575] border-2 border-white shadow-sm"></div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                              <h3 className="font-bold text-lg text-[#36454F]">{phase.phaseName}</h3>
                              <span className="text-xs font-bold uppercase tracking-wider text-[#9CAFB7] bg-[#9CAFB7]/10 px-2 py-1 rounded">{phase.duration}</span>
                          </div>
                          <p className="text-sm text-[#36454F]/80 mb-3 italic">{phase.description}</p>
                          <ul className="list-disc list-inside text-sm text-[#36454F]/90 space-y-1">
                              {phase.tasks.map((task, tIdx) => (
                                  <li key={tIdx}>{task}</li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 text-right font-bold text-[#5F8575]">
                  Total Estimated Time: {plan.totalDuration}
              </div>
          </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onRemove={onRemoveProject} />
        ))}
      </div>
    </div>
  );
};

export default MyProjects;
