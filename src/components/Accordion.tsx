import React, { useState, ReactNode } from 'react';

interface AccordionProps {
  title: ReactNode;
  children: ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2 border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 font-semibold text-left bg-gray-50 hover:bg-gray-100"
      >
        <span>{title}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          ▶
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t">
          {children}
        </div>
      )}
    </div>
  );
};
