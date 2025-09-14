import React, { useState } from 'react';
import ToolModalBase from './ToolModalBase';
import { UploadIcon } from '../icons/UploadIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Set workerSrc for pdf.js to use the CDN version compatible with Vite bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;


interface PdfToDocModalProps {
  onClose: () => void;
}

const PdfToDocModal: React.FC<PdfToDocModalProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
      }

      const blob = new Blob([fullText], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${file.name.replace('.pdf', '')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();

    } catch (error) {
        console.error("Error converting PDF to Doc:", error);
        alert("An error occurred during conversion. This tool only supports text extraction.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ToolModalBase title="Convert PDF to Doc" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {!file ? (
           <label htmlFor="pdf-upload" className="border-2 border-dashed rounded-lg p-6 sm:p-10 text-center border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer">
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 font-medium text-indigo-600 hover:text-indigo-500">
                  Select a PDF file
              </p>
              <input id="pdf-upload" name="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="border rounded-md p-3 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-700 truncate">{file.name}</span>
            </div>
            <button onClick={() => setFile(null)} className="text-sm text-indigo-600 hover:underline">Change</button>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800">Cancel</button>
            <button onClick={handleConvert} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold disabled:bg-gray-400" disabled={!file || isLoading}>
                {isLoading ? 'Converting...' : 'Convert'}
            </button>
        </div>
      </div>
    </ToolModalBase>
  );
};

export default PdfToDocModal;
