import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageGrid } from './components/ImageGrid';
import { ModelSelector } from './components/ModelSelector';
import { ResultDisplay } from './components/ResultDisplay';
import { ImageFile, AnalysisResult } from './types';
import { analyzeImages, verifyApiKey } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { TrashIcon, DownloadIcon, LoadingSpinner } from './components/icons';
import { ApiKeyForm } from './components/ApiKeyForm';

function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [concept, setConcept] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{ reference: ImageFile, checking: ImageFile, result: AnalysisResult } | null>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(true);

  useEffect(() => {
    const checkEnvKey = async () => {
      const envKey = process.env.API_KEY;
      if (envKey) {
        const isValid = await verifyApiKey(envKey);
        if (isValid) {
          setApiKey(envKey);
          setIsApiKeyValid(true);
        }
      }
      setIsVerifyingApiKey(false);
    };
    checkEnvKey();
  }, []);
  
  const handleKeyVerified = (verifiedKey: string) => {
    setApiKey(verifiedKey);
    setIsApiKeyValid(true);
  };

  const handleImagesUpload = useCallback(async (files: File[]) => {
    const imageFilesToAdd = new Map<string, File>();
    const captionsToAdd = new Map<string, string>();

    const processFile = async (file: File) => {
        const basename = file.name.substring(0, file.name.lastIndexOf('.'));
        if (file.type.startsWith('image/')) {
            imageFilesToAdd.set(basename, file);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const content = await file.text();
            captionsToAdd.set(basename, content);
        }
    };

    for (const file of files) {
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            try {
                const JSZip = (await import('jszip')).default;
                const zip = await JSZip.loadAsync(file);
                for (const filename in zip.files) {
                    if (!zip.files[filename].dir) {
                        const zipEntry = zip.files[filename];
                        const blob = await zipEntry.async('blob');
                        
                        let mimeType = 'application/octet-stream';
                        const lowerFilename = filename.toLowerCase();
                        if (lowerFilename.endsWith('.png')) mimeType = 'image/png';
                        else if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) mimeType = 'image/jpeg';
                        else if (lowerFilename.endsWith('.webp')) mimeType = 'image/webp';
                        else if (lowerFilename.endsWith('.txt')) mimeType = 'text/plain';

                        const newFile = new File([blob], filename, { type: mimeType });
                        await processFile(newFile);
                    }
                }
            } catch (e) {
                console.error("Error processing zip file", e);
                setError("Could not process the zip file. It might be corrupted.");
            }
        } else {
            await processFile(file);
        }
    }

    setImages(prevImages => {
        // First, check for caption updates on existing images
        const updatedPrevImages = prevImages.map(img => {
            const basename = img.name.substring(0, img.name.lastIndexOf('.'));
            if (captionsToAdd.has(basename)) {
                const updatedImg = { ...img, caption: captionsToAdd.get(basename)! };
                captionsToAdd.delete(basename); // Consume the caption
                return updatedImg;
            }
            return img;
        });
        
        // Next, create new ImageFile objects for new images
        const newImageObjects: ImageFile[] = [];
        for (const [basename, file] of imageFilesToAdd.entries()) {
             // Avoid adding duplicates if they were already in prevImages
            if (prevImages.some(img => img.name === file.name)) continue;

            newImageObjects.push({
                id: uuidv4(),
                file,
                previewUrl: URL.createObjectURL(file),
                name: file.name,
                status: 'unprocessed',
                caption: captionsToAdd.get(basename),
            });
        }
        
        return [...updatedPrevImages, ...newImageObjects];
    });
  }, []);

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  };
  
  const handleClearAll = () => setImages([]);
  
  const handleRemoveDuplicates = () => {
    setImages(prev => prev.filter(img => img.status !== 'duplicate'));
  };
  
  const handleDownloadZip = async () => {
    setIsZipping(true);
    setError(null);
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        const imagesToZip = images;
        if (imagesToZip.length === 0) {
            setIsZipping(false);
            return;
        }

        imagesToZip.forEach(imageFile => {
            zip.file(imageFile.name, imageFile.file);
            if (imageFile.caption) {
                const basename = imageFile.name.substring(0, imageFile.name.lastIndexOf('.'));
                zip.file(`${basename}.txt`, imageFile.caption);
            }
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        const conceptName = concept.trim().replace(/\s+/g, '_') || 'dataset';
        link.download = `${conceptName}_curated.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        console.error("Failed to create ZIP file", err);
        setError("Could not create the ZIP file. See console for details.");
    } finally {
        setIsZipping(false);
    }
  };


  const handleStartAnalysis = async () => {
    if (!isApiKeyValid || !apiKey) {
      setError("A valid Gemini API Key is required to start the analysis.");
      return;
    }
    if (images.length < 2) {
      setError("Please upload at least two images to compare.");
      return;
    }
    if (!concept.trim()) {
      setError("Please provide a training concept.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentAnalysis(null);
    
    const currentImagesState = images.map(img => ({...img, status: img.status === 'duplicate' ? 'duplicate' : 'unprocessed' }));
    setImages(currentImagesState);


    for (let i = 0; i < currentImagesState.length; i++) {
        if (currentImagesState[i].status !== 'unprocessed') {
            continue;
        }

        const referenceImage = currentImagesState[i];
        
        const unprocessedImagesToCheck = currentImagesState.filter((img, index) => index !== i && img.status === 'unprocessed');
        const totalComparisons = unprocessedImagesToCheck.length;

        referenceImage.status = 'processing';
        referenceImage.comparisons = 0;
        referenceImage.totalComparisons = totalComparisons;
        
        setImages(prevImages => prevImages.map(img => 
            img.id === referenceImage.id 
                ? { ...img, status: 'processing', comparisons: 0, totalComparisons } 
                : img
        ));

        const duplicatesFoundIds: string[] = [];
        let comparisonsDone = 0;

        for (const imageToCheck of unprocessedImagesToCheck) {
            setCurrentAnalysis({ reference: referenceImage, checking: imageToCheck, result: null! });
            
            const result = await analyzeImages(referenceImage.file, imageToCheck.file, concept, selectedModel, apiKey);
            
            if (result.verdict === 'UNKNOWN') {
                setError(`${result.analysis}: ${result.reasoning}`);
                setIsLoading(false);
                setImages(images.map(img => ({...img, status: 'unprocessed' })));
                return;
            }
            
            setCurrentAnalysis({ reference: referenceImage, checking: imageToCheck, result });
            
            comparisonsDone++;
            referenceImage.comparisons = comparisonsDone;
            
            setImages(prevImages => prevImages.map(img => 
                img.id === referenceImage.id 
                    ? { ...img, comparisons: comparisonsDone } 
                    : img
            ));
            
            if (result.verdict === 'DUPLICATE') {
                duplicatesFoundIds.push(imageToCheck.id);
            }
        }
        
        referenceImage.status = 'unique';
        delete referenceImage.comparisons;
        delete referenceImage.totalComparisons;

        duplicatesFoundIds.forEach(dupeId => {
            const dupe = currentImagesState.find(img => img.id === dupeId);
            if (dupe) {
                dupe.status = 'duplicate';
            }
        });
        
        setImages([...currentImagesState]);
    }

    setIsLoading(false);
    setCurrentAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Semantic Image Duplicate Detector
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
            Curate diverse image datasets by identifying and grouping compositionally similar images using Gemini.
          </p>
        </header>

        <main className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {isApiKeyValid ? (
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" title="API Key is verified" />
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200">API Key Status</h3>
                        <p className="text-sm text-green-400">
                            Verified and ready for analysis.
                        </p>
                    </div>
                </div>
              ) : (
                <ApiKeyForm onKeyVerified={handleKeyVerified} isVerifyingAtStartup={isVerifyingApiKey} />
              )}
              <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} disabled={isLoading || !isApiKeyValid} />
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2">
                <label htmlFor="concept" className="block text-lg font-semibold text-slate-200">
                    Training Concept
                </label>
                <input
                    id="concept"
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="e.g., 'a red sports car'"
                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading || !isApiKeyValid}
                />
                 <p className="text-xs text-slate-500">
                    This helps the AI understand the core subject of your dataset.
                </p>
            </div>
          </section>

          <section>
            <ImageUploader onImagesUpload={handleImagesUpload} />
          </section>

          {images.length > 0 && (
            <section className="bg-slate-800/50 p-6 rounded-2xl shadow-inner border border-slate-700">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-slate-200">Uploaded Images ({images.length})</h2>
                    <div className="flex items-center flex-wrap gap-2">
                        <button
                            onClick={handleRemoveDuplicates}
                            title="Remove all images marked as 'duplicate'"
                            disabled={isLoading || isZipping || !images.some(i => i.status === 'duplicate')}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Remove Duplicates
                        </button>
                        <button
                            onClick={handleDownloadZip}
                            title="Download all current images as a ZIP file"
                            disabled={isLoading || isZipping || images.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 text-slate-200 font-semibold rounded-lg hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isZipping ? <LoadingSpinner className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
                            {isZipping ? 'Zipping...' : 'Download Curated'}
                        </button>
                         <button
                            onClick={handleClearAll}
                            title="Remove all images"
                            disabled={isLoading || isZipping || images.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-800 text-red-200 font-semibold rounded-lg hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                        >
                            <TrashIcon className="h-4 w-4" />
                            Clear All
                        </button>
                        <button
                            onClick={handleStartAnalysis}
                            disabled={isLoading || isZipping || images.length < 2 || !concept || !isApiKeyValid}
                            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Analyzing...' : 'Start Analysis'}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-400 mb-4">{error}</p>}
                <ImageGrid images={images} onRemove={handleRemoveImage} />
            </section>
          )}

          {isLoading && currentAnalysis && currentAnalysis.result && (
            <section>
                <div className="flex items-center justify-center space-x-4 mb-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">Reference</p>
                        <img src={currentAnalysis.reference.previewUrl} alt="Reference" className="w-24 h-24 object-cover rounded-lg border-2 border-cyan-400"/>
                    </div>
                    <div className="text-2xl font-bold text-slate-500">vs.</div>
                     <div>
                        <p className="text-sm text-slate-400 mb-1">Checking</p>
                        <img src={currentAnalysis.checking.previewUrl} alt="Checking" className="w-24 h-24 object-cover rounded-lg border-2 border-purple-400"/>
                    </div>
                </div>
              <ResultDisplay result={currentAnalysis.result} />
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;