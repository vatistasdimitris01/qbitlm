import React, { useState } from 'react';
import ToolModalBase from './ToolModalBase';
import { UploadIcon } from '../icons/UploadIcon';
import { PDFDocument } from 'pdf-lib';

interface MergePdfModalProps {
  onClose: () => void;
}

const MergePdfModal: React.FC<MergePdfModalProps> = ({ onClose }) => {
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
    if (files.length < 2) return;
    setIsLoading(true);

    try {
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
            const pdfBytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'merged.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onClose();

    } catch (error) {
        console.error("Error merging PDFs:", error);
        alert("An error occurred while merging PDFs. Please ensure all files are valid PDFs.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ToolModalBase title="Merge PDF Files" onClose={onClose}>
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
                <label htmlFor="pdf-merge-upload" className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    Upload PDFs
                </label>
                {' '}or drag and drop
            </p>
            <input id="pdf-merge-upload" name="pdf-merge-upload" type="file" className="sr-only" multiple accept=".pdf" onChange={handleFileChange} />
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
            <button onClick={handleConvert} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold disabled:bg-gray-400" disabled={files.length < 2 || isLoading}>
                {isLoading ? 'Merging...' : 'Merge'}
            </button>
        </div>
      </div>
    </ToolModalBase>
  );
};

export default MergePdfModal;