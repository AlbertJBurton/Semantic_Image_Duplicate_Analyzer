import React, { useState } from 'react';
import { ImageFile, ImageStatus } from '../types';
import { LoadingSpinner, DocumentTextIcon } from './icons';
import { CaptionModal } from './CaptionModal';

const getStatusStyles = (status: ImageStatus) => {
    switch (status) {
        case 'unique':
            return { bgColor: 'bg-green-900/80', textColor: 'text-green-300', borderColor: 'border-green-500', text: 'UNIQUE' };
        case 'processing':
            return { bgColor: 'bg-blue-900/80', textColor: 'text-blue-300', borderColor: 'border-blue-500', text: 'PROCESSING' };
        case 'duplicate':
            return {
                bgColor: 'bg-yellow-900/80',
                textColor: 'text-yellow-300',
                borderColor: 'border-yellow-600',
                text: `DUPLICATE`
            };
        case 'unprocessed':
        default:
            return { bgColor: 'bg-slate-700/80', textColor: 'text-slate-300', borderColor: 'border-slate-600', text: 'UNPROCESSED' };
    }
};

const ImageGridItem: React.FC<{ image: ImageFile, onRemove: (id: string) => void, onShowCaption: () => void }> = ({ image, onRemove, onShowCaption }) => {
    const { bgColor, textColor, borderColor, text } = getStatusStyles(image.status);
    return (
        <div className={`group relative aspect-square border-2 rounded-lg overflow-hidden transition-all duration-300 ${borderColor} animate-fade-in`}>
            <img src={image.previewUrl} alt={image.name} className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <p className="text-xs font-mono truncate">{image.name}</p>
                 <div className={`mt-1 flex items-center justify-between px-2 py-0.5 rounded-full text-xs font-bold ${bgColor} ${textColor}`}>
                    <div className="flex items-center">
                        <span>{text}</span>
                        {image.status === 'processing' && <LoadingSpinner className="inline-block ml-1 h-3 w-3" />}
                    </div>
                    {image.status === 'processing' && image.comparisons != null && image.totalComparisons != null && (
                        <span className="font-mono">{`${image.comparisons}/${image.totalComparisons}`}</span>
                    )}
                </div>
            </div>
            
            {image.caption && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowCaption();
                    }}
                    className="absolute top-1 left-1 bg-slate-900/70 text-white rounded-full p-1.5 hover:bg-blue-600/80 transition-all scale-0 group-hover:scale-100"
                    aria-label="Show caption"
                    title="Show caption"
                >
                    <DocumentTextIcon className="h-4 w-4" />
                </button>
            )}

            <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(image.id)
                }}
                className="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-1.5 hover:bg-red-600/80 transition-all scale-0 group-hover:scale-100"
                aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


export const ImageGrid: React.FC<{ images: ImageFile[], onRemove: (id: string) => void }> = ({ images, onRemove }) => {
    const [viewingCaptionFor, setViewingCaptionFor] = useState<ImageFile | null>(null);

    return (
    <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map(image => (
                <ImageGridItem 
                    key={image.id} 
                    image={image} 
                    onRemove={onRemove} 
                    onShowCaption={() => image.caption && setViewingCaptionFor(image)}
                />
            ))}
        </div>
        {viewingCaptionFor?.caption && (
            <CaptionModal
                imageName={viewingCaptionFor.name}
                caption={viewingCaptionFor.caption}
                onClose={() => setViewingCaptionFor(null)}
            />
        )}
    </>
  );
};