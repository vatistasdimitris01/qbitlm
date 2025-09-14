import React, { useState, useRef, useEffect } from 'react';
import { Notebook } from '../types';
import { NotebookIcon } from './icons/NotebookIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { TrashIcon } from './icons/TrashIcon';
import ToolsToolbar from './ToolsToolbar';
import ImageToPdfModal from './modals/ImageToPdfModal';
import PdfToDocModal from './modals/PdfToDocModal';
import MergePdfModal from './modals/MergePdfModal';

type ActiveTool = 'imageToPdf' | 'pdfToDoc' | 'mergePdf' | null;

interface HomePageProps {
    notebooks: Notebook[];
    onSelectNotebook: (id: string) => void;
    onCreateNotebook: () => void;
    onDeleteNotebook: (id: string) => void;
}

const formatNotebookDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const NotebookCard: React.FC<{ notebook: Notebook; onSelect: () => void; onDelete: () => void; }> = ({ notebook, onSelect, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
        setMenuOpen(false);
    }

    return (
        <div className="relative group">
            <button
                onClick={onSelect}
                className="w-full h-40 p-4 bg-gray-100 border border-gray-200 rounded-lg flex flex-col justify-between text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">{notebook.title}</h3>
                </div>
                <div className="text-xs text-gray-500">
                    <span>{formatNotebookDate(notebook.lastModified)}</span>
                    <span className="mx-1">&middot;</span>
                    <span>{notebook.sources.length} sources</span>
                </div>
            </button>
            <div className="absolute top-2 right-2" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                    <DotsVerticalIcon className="w-5 h-5" />
                </button>
                {menuOpen && (
                     <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <TrashIcon className="w-4 h-4"/>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ notebooks, onSelectNotebook, onCreateNotebook, onDeleteNotebook }) => {
    const sortedNotebooks = [...notebooks].sort((a, b) => b.lastModified - a.lastModified);
    const [activeTool, setActiveTool] = useState<ActiveTool>(null);
    
    return (
        <div className="flex flex-col h-screen">
            <header className="h-14 flex-shrink-0 flex items-center px-4 md:px-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3">
                    <NotebookIcon className="w-7 h-7 text-indigo-500" />
                    <h1 className="text-xl font-bold text-gray-900">qbit LM</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 pb-24">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent notebooks</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <button
                            onClick={onCreateNotebook}
                            className="w-full h-40 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <FolderPlusIcon className="w-10 h-10" />
                            <span className="mt-2 font-medium">Create new notebook</span>
                        </button>
                        {sortedNotebooks.map(notebook => (
                            <NotebookCard
                                key={notebook.id}
                                notebook={notebook}
                                onSelect={() => onSelectNotebook(notebook.id)}
                                onDelete={() => onDeleteNotebook(notebook.id)}
                            />
                        ))}
                    </div>
                </div>
            </main>
            <ToolsToolbar onToolSelect={setActiveTool} />

            {activeTool === 'imageToPdf' && <ImageToPdfModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'pdfToDoc' && <PdfToDocModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'mergePdf' && <MergePdfModal onClose={() => setActiveTool(null)} />}
        </div>
    );
};

export default HomePage;