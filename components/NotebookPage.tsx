import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Notebook, Source } from '../types';
import SourcePanel from './SourcePanel';
import ChatPanel from './ChatPanel';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface NotebookPageProps {
  notebook: Notebook;
  onUpdateNotebook: (notebook: Notebook) => void;
  onGoHome: () => void;
}

const NotebookPage: React.FC<NotebookPageProps> = ({ notebook, onUpdateNotebook, onGoHome }) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(notebook.sources[0]?.id || null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(notebook.title);
  const [isSourcePanelOpen, setIsSourcePanelOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleAddMultipleSources = (newSources: Source[]) => {
    const updatedNotebook = {
      ...notebook,
      sources: [...notebook.sources, ...newSources],
    };
    onUpdateNotebook(updatedNotebook);
    if (newSources.length > 0) {
      setSelectedSourceId(newSources[0].id);
    }
  };

  const handleDeleteSource = (sourceIdToDelete: string) => {
    const updatedNotebook = {
      ...notebook,
      sources: notebook.sources.filter(s => s.id !== sourceIdToDelete),
    };
    onUpdateNotebook(updatedNotebook);
    
    if (selectedSourceId === sourceIdToDelete) {
      // Select the first source if it exists, otherwise null
      setSelectedSourceId(updatedNotebook.sources[0]?.id || null);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() === '') {
        setTitle(notebook.title); // revert if empty
        return;
    }
    if (title !== notebook.title) {
        onUpdateNotebook({ ...notebook, title });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        titleInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
        setTitle(notebook.title);
        setIsEditingTitle(false);
    }
  };

  const selectedSource = useMemo(() => {
    return notebook.sources.find(s => s.id === selectedSourceId) || null;
  }, [notebook.sources, selectedSourceId]);

  return (
    <div className="flex h-screen font-sans bg-slate-50 text-gray-800 flex-col">
      <header className="h-16 flex-shrink-0 flex items-center px-2 sm:px-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-20">
        <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-200 mr-1 sm:mr-2">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600"/>
        </button>
        <button 
          onClick={() => setIsSourcePanelOpen(true)} 
          className="p-2 rounded-full hover:bg-gray-200 mr-1 sm:mr-2 md:hidden"
          aria-label="Open sources panel"
        >
          <ListBulletIcon className="w-5 h-5 text-gray-600"/>
        </button>
        {isEditingTitle ? (
            <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-bold text-gray-900 bg-transparent rounded-md outline-none ring-2 ring-indigo-500 -m-1 p-1 w-full"
            />
        ) : (
            <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-900 rounded-md cursor-pointer -m-1 p-1 truncate"
            >
                {notebook.title}
            </h1>
        )}
      </header>
      <main className="flex flex-1 overflow-hidden">
        <SourcePanel
          sources={notebook.sources}
          onAddMultipleSources={handleAddMultipleSources}
          onDeleteSource={handleDeleteSource}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
          isOpen={isSourcePanelOpen}
          onClose={() => setIsSourcePanelOpen(false)}
        />
        <ChatPanel key={selectedSource?.id} source={selectedSource} />
      </main>
    </div>
  );
};

export default NotebookPage;