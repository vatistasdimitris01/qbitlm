import React, { useState } from 'react';
import ToolModalBase from './ToolModalBase';
import { UploadIcon } from '../icons/UploadIcon';
import { jsPDF } from 'jspdf';

interface ImageToPdfModalProps {
  onClose: () => void;
}

const ImageToPdfModal: React.FC<ImageToPdfModalProps> = ({ onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles) {
        setFiles(prev => [...prev, ...Array.from(droppedFiles)]);
      }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsLoading(true);

    try {
      const pdf = new jsPDF();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const widthRatio = pageWidth / image.width;
        const heightRatio = pageHeight / image.height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        const imgWidth = image.width * ratio;
        const imgHeight = image.height * ratio;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(image, 'PNG', (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
      }
      pdf.save('converted-images.pdf');
      onClose();
    } catch (error) {
        console.error("Error converting images to PDF:", error);
        alert("An error occurred during conversion. Please check the console.");
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <ToolModalBase title="Convert Images to PDF" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div 
            className={`border-2 border-dashed rounded-lg p-6 sm:p-10 text-center ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
                <label htmlFor="image-upload" className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    Upload images
                </label>
                {' '}or drag and drop
            </p>
            <input id="image-upload" name="image-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} />
        </div>
        {files.length > 0 && (
          <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
            <ul className="text-sm text-gray-700 divide-y">
              {files.map((file, index) => (
                <li key={index} className="p-1 truncate">{file.name}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800">Cancel</button>
            <button onClick={handleConvert} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold disabled:bg-gray-400" disabled={files.length === 0 || isLoading}>
                {isLoading ? 'Converting...' : 'Convert'}
            </button>
        </div>
      </div>
    </ToolModalBase>
  );
};

export default ImageToPdfModal;
