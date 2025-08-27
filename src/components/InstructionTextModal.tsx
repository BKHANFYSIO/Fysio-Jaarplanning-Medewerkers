import React from 'react';
import { X, FileText } from 'lucide-react';

interface InstructionTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
}

export const InstructionTextModal: React.FC<InstructionTextModalProps> = ({ isOpen, onClose, title, text }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Instructies</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">
          <h4 className="text-base font-medium text-gray-900 mb-2">{title}</h4>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{text}</p>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Sluiten</button>
        </div>
      </div>
    </div>
  );
};


