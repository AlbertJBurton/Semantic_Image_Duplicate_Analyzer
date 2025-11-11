import React from 'react';
import { AnalysisResult } from '../types';

interface ResultDisplayProps {
  result: AnalysisResult;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const verdictClass =
    result.verdict === 'DUPLICATE'
      ? 'bg-red-500 text-red-900 border-red-400'
      : result.verdict === 'UNIQUE'
      ? 'bg-green-500 text-green-900 border-green-400'
      : 'bg-slate-500 text-slate-900 border-slate-400';
  
  const formattedAnalysis = result.analysis.split('*').filter(s => s.trim()).map((item, index) => (
    <li key={index} className="list-disc list-inside mb-1">{item.trim()}</li>
  ));

  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Analysis Result</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-600 pb-2 mb-3">Verdict</h3>
        <div className={`inline-block px-4 py-1.5 rounded-full text-xl font-bold ${verdictClass} border`}>
          {result.verdict}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-600 pb-2 mb-3">Composition Analysis</h3>
        <ul className="text-slate-300 space-y-2">
            {formattedAnalysis}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-600 pb-2 mb-3">Reasoning</h3>
        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{result.reasoning}</p>
      </div>
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
    `}</style>
    </div>
  );
};
