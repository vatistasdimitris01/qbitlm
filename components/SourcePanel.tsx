import React, { useState, useCallback } from 'react';
import { Source, SourceOrigin } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ClipboardTextIcon } from './icons/ClipboardTextIcon';
import { UploadIcon } from './icons/UploadIcon';
import { ImageIcon } from './icons/ImageIcon';
import { VideoIcon } from './icons/VideoIcon';
import { XIcon } from './icons/XIcon';

type AddMultipleSourcesHandler = (sources: Source[]) => void;
type DeleteSourceHandler = (sourceId: string) => void;

const AddSourceModal: React.FC<{ onAdd: AddMultipleSourcesHandler; onClose: () => void; }> = ({ onAdd, onClose }) => {
    const [activeTab, setActiveTab] = useState<'file' | 'website' | 'text'>('file');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const filePromises = Array.from(files).map(file => {
            return new Promise<Source>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target?.result as string;
                    let type: SourceOrigin['type'] = 'file';
                    if (file.type.startsWith('image/')) {
                        type = 'image';
                    } else if (file.type.startsWith('video/')) {
                        type = 'video';
                    }
                    
                    const newSource: Source = {
                        id: `source-${Date.now()}-${file.name}-${Math.random()}`,
                        title: file.name,
                        content: fileContent,
                        origin: { type, name: file.name },
                        mimeType: file.type,
                    };
                    resolve(newSource);
                };
                reader.onerror = (error) => {
                    console.error('Error reading file:', file.name, error);
                    reject(error);
                };

                if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                    reader.readAsDataURL(file); // For media, read as Base64 data URL
                } else {
                    reader.readAsText(file); // For text-based files
                }
            });
        });

        try {
            const sources = await Promise.all(filePromises);
            onAdd(sources);
            onClose();
        } catch (error) {
            alert('There was an error processing one or more files.');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files) handleFiles(files);
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            const newSource: Source = {
                id: `source-${Date.now()}`,
                title,
                content,
                origin: { type: 'text', name: 'Pasted Text' }
            };
            onAdd([newSource]);
            onClose();
        }
    };
    
    const handleWebsiteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            try {
                const urlObject = new URL(url);
                const newSource: Source = {
                    id: `source-${Date.now()}`,
                    title: urlObject.hostname,
                    content: url,
                    origin: { type: 'website', name: urlObject.hostname }
                };
                onAdd([newSource]);
                onClose();
            } catch (error) {
                alert("Please enter a valid URL.");
            }
        }
    };

    const tabButtonClasses = (tabName: typeof activeTab) => 
        `px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 ${
        activeTab === tabName ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`;
    
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Add New Source</h2>
                <div className="mb-5 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-1 sm:space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('file')} className={tabButtonClasses('file')}>File</button>
                        <button onClick={() => setActiveTab('website')} className={tabButtonClasses('website')}>Website</button>
                        <button onClick={() => setActiveTab('text')} className={tabButtonClasses('text')}>Text</button>
                    </nav>
                </div>

                {activeTab === 'file' && (
                     <div 
                        className={`border-2 border-dashed rounded-lg p-6 sm:p-10 text-center ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                        onDragEnter={() => setIsDragging(true)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                     >
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                            <label htmlFor="file-upload" className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                Upload files
                            </label>
                            {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Images, Videos, TXT, MD, etc.</p>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={(e) => handleFiles(e.target.files)} />
                    </div>
                )}
                
                {activeTab === 'website' && (
                     <form onSubmit={handleWebsiteSubmit} className="flex flex-col gap-4">
                        <input
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                        />
                         <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold">Add Source</button>
                        </div>
                    </form>
                )}

                {activeTab === 'text' && (
                    <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Source Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                        />
                        <textarea
                            placeholder="Paste your source content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900 h-48 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                            required
                        />
                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold">Add Source</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const SourceIcon: React.FC<{ type: SourceOrigin['type'] }> = ({ type }) => {
    const className = "w-5 h-5 mr-3 text-gray-400 flex-shrink-0";
    switch (type) {
        case 'file': return <FileTextIcon className={className} />;
        case 'website': return <GlobeIcon className={className} />;
        case 'text': return <ClipboardTextIcon className={className} />;
        case 'image': return <ImageIcon className={className} />;
        case 'video': return <VideoIcon className={className} />;
        default: return null;
    }
};

const SourcePanel: React.FC<{
  sources: Source[];
  onAddMultipleSources: AddMultipleSourcesHandler;
  onDeleteSource: DeleteSourceHandler;
  selectedSourceId: string | null;
  onSelectSource: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ sources, onAddMultipleSources, onDeleteSource, selectedSourceId, onSelectSource, isOpen, onClose }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = (e: React.MouseEvent, sourceId: string) => {
        e.stopPropagation(); // Prevent the source from being selected when clicking delete
        if (window.confirm("Are you sure you want to delete this source?")) {
            onDeleteSource(sourceId);
        }
    };
    
    const handleSelectAndClose = (sourceId: string) => {
        onSelectSource(sourceId);
        onClose();
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity md:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className={`fixed inset-y-0 left-0 z-40 w-full max-w-sm flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:inset-auto md:w-1/3 md:max-w-sm md:translate-x-0 border-r border-gray-200 bg-white/80 backdrop-blur-sm ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center h-16">
                    <h2 className="text-lg font-semibold text-gray-900">Sources</h2>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
                        <PlusIcon className="w-5 h-5" />
                        Add
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sources.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <FileTextIcon className="w-12 h-12 mx-auto text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No sources</h3>
                            <p className="mt-1 text-sm text-gray-500">Add a source to get started.</p>
                        </div>
                    ) : (
                        <ul className="p-2">
                            {sources.map(source => (
                                <li key={source.id} className="group relative">
                                    <button
                                        onClick={() => handleSelectAndClose(source.id)}
                                        className={`w-full flex items-center text-left p-3 rounded-md transition-colors ${selectedSourceId === source.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                                    >
                                        <SourceIcon type={source.origin.type} />
                                        <span className="truncate flex-1 pr-6">{source.title}</span>
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, source.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                        aria-label={`Delete source ${source.title}`}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>
            {isModalOpen && <AddSourceModal onAdd={onAddMultipleSources} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

export default SourcePanel;