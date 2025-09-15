import React, { useState, useCallback } from 'react';
import { BookOpenIcon } from './icons';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div
        className={`w-full max-w-lg p-8 border-2 border-dashed rounded-lg text-center transition-colors duration-300 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-base-300 dark:border-dark-base-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <BookOpenIcon className="w-16 h-16 text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-base-content dark:text-dark-base-content">Welcome to your Personal Library</h2>
          <p className="text-base-content/80 dark:text-dark-base-content/80 mb-6">
            Drag and drop an EPUB file here, or click to select a file to start reading.
          </p>
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
          >
            {isLoading ? 'Processing...' : 'Upload Novel'}
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept=".epub"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};