import React from 'react';
import { XIcon } from '../icons/XIcon';

interface ToolModalBaseProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ToolModalBase: React.FC<ToolModalBaseProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ToolModalBase;
