import React, { useState } from 'react';
import { verifyApiKey } from '../services/geminiService';
import { LoadingSpinner } from './icons';

interface ApiKeyFormProps {
  onKeyVerified: (apiKey: string) => void;
  isVerifyingAtStartup: boolean;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onKeyVerified, isVerifyingAtStartup }) => {
    const [apiKey, setApiKey] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        setIsVerifying(true);
        setError(null);
        const isValid = await verifyApiKey(apiKey);
        setIsVerifying(false);
        if (isValid) {
            onKeyVerified(apiKey);
        } else {
            setError('Invalid API Key. Please check and try again.');
        }
    };

    if (isVerifyingAtStartup) {
        return (
             <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center space-x-3">
                <LoadingSpinner className="w-5 h-5" />
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Verifying API Key...</h3>
                    <p className="text-sm text-slate-400">
                        Checking the key provided in the environment.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-red-900/50 p-4 rounded-lg border border-red-700 space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-red-200">API Key Required</h3>
                <p className="text-sm text-red-300">
                    Your environment API key is missing or invalid. Please enter a valid Gemini API key to continue.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isVerifying}
                />
                <button
                    onClick={handleVerify}
                    disabled={isVerifying || !apiKey}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    {isVerifying ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
                    {isVerifying ? 'Verifying...' : 'Verify & Save'}
                </button>
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
    );
};