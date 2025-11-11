import React from 'react';

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  disabled: boolean;
}

// FIX: Provide a list of recommended models for the task.
const models = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, setSelectedModel, disabled }) => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <label htmlFor="model-selector" className="block text-lg font-semibold text-slate-200 mb-2">
        Select Model
      </label>
      <select
        id="model-selector"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        disabled={disabled}
        className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
       <p className="text-xs text-slate-500 mt-2">
        Gemini 2.5 Flash is recommended for its balance of speed and capability for this task.
      </p>
    </div>
  );
};
