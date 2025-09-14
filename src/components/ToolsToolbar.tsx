import React from 'react';
import { ImageIcon } from './icons/ImageIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';

interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1.5 text-gray-600 hover:text-indigo-600 transition-colors group"
    >
        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors border border-gray-200 group-hover:border-indigo-200">
            {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
    </button>
);

interface ToolsToolbarProps {
    onToolSelect: (tool: 'imageToPdf' | 'pdfToDoc' | 'mergePdf') => void;
}

const ToolsToolbar: React.FC<ToolsToolbarProps> = ({ onToolSelect }) => {
    return (
        <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4">
            <div className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-full shadow-lg p-2">
                <nav className="flex items-center gap-4 px-4">
                    <ToolButton 
                        icon={<ImageIcon className="w-6 h-6" />}
                        label="Image to PDF"
                        onClick={() => onToolSelect('imageToPdf')}
                    />
                    <ToolButton 
                        icon={<DocumentDuplicateIcon className="w-6 h-6" />}
                        label="PDF to Doc"
                        onClick={() => onToolSelect('pdfToDoc')}
                    />
                     <ToolButton 
                        icon={<DocumentPlusIcon className="w-6 h-6" />}
                        label="Merge PDF"
                        onClick={() => onToolSelect('mergePdf')}
                    />
                </nav>
            </div>
        </div>
    );
};

export default ToolsToolbar;
