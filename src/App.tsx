import React, { useState } from 'react';
import { Notebook } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import HomePage from './components/HomePage';
import NotebookPage from './components/NotebookPage';

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useLocalStorage<Notebook[]>('notebooks', []);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);

  const handleCreateNotebook = () => {
    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      title: 'Untitled Notebook',
      sources: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setNotebooks(prev => [newNotebook, ...prev]);
    setActiveNotebookId(newNotebook.id);
  };

  const handleDeleteNotebook = (notebookId: string) => {
    if (window.confirm("Are you sure you want to delete this notebook and all its sources?")) {
      setNotebooks(prev => prev.filter(n => n.id !== notebookId));
      if (activeNotebookId === notebookId) {
        setActiveNotebookId(null);
      }
    }
  };

  const handleUpdateNotebook = (updatedNotebook: Notebook) => {
    setNotebooks(prev => 
      prev.map(n => n.id === updatedNotebook.id ? { ...updatedNotebook, lastModified: Date.now() } : n)
    );
  };
  
  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
  };

  const handleGoHome = () => {
    setActiveNotebookId(null);
  };

  const activeNotebook = notebooks.find(n => n.id === activeNotebookId);

  return (
    <div className="h-screen font-sans bg-white text-gray-800 antialiased">
      {activeNotebook ? (
        <NotebookPage
          key={activeNotebook.id}
          notebook={activeNotebook}
          onUpdateNotebook={handleUpdateNotebook}
          onGoHome={handleGoHome}
        />
      ) : (
        <HomePage
          notebooks={notebooks}
          onSelectNotebook={handleSelectNotebook}
          onCreateNotebook={handleCreateNotebook}
          onDeleteNotebook={handleDeleteNotebook}
        />
      )}
    </div>
  );
};

export default App;
