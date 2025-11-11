import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImagesUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onImagesUpload(Array.from(files));
    }
  }, [onImagesUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files) {
      onImagesUpload(Array.from(files));
    }
  }, [onImagesUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div
      className={`relative w-full p-8 bg-slate-900/80 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? 'border-purple-500 bg-slate-800/60 scale-105' : 'hover:border-purple-400'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-upload-input')?.click()}
    >
      <input
        type="file"
        id="file-upload-input"
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, application/zip, text/plain"
        className="hidden"
        multiple
      />
      <div className="text-center text-slate-500">
        <UploadIcon className="mx-auto h-12 w-12" />
        <p className="mt-2 font-semibold">
          <span className="text-purple-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs">Images, .txt files, or .zip archives</p>
      </div>
    </div>
  );
};