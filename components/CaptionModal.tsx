import React from 'react';

interface CaptionModalProps {
  imageName: string;
  caption: string;
  onClose: () => void;
}

export const CaptionModal: React.FC<CaptionModalProps> = ({ imageName, caption, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="caption-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 border border-slate-700 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="caption-title" className="text-lg font-semibold text-slate-200 truncate" title={imageName}>
            Caption for: {imageName}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close caption viewer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <pre className="bg-slate-900 p-4 rounded-md text-slate-300 whitespace-pre-wrap font-mono text-sm max-h-[60vh] overflow-y-auto border border-slate-700">
          {caption}
        </pre>
      </div>
      <style>{`
        @keyframes fade-in-fast {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast {
            animation: fade-in-fast 0.2s ease-out forwards;
        }
        .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
