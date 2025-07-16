import React from 'react';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

export function FilterButton({ label, isActive, onClick, color = 'blue' }: FilterButtonProps) {
  const baseClasses = "px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md relative";
  
  // Color accent for left border (matching card colors)
  const getColorAccent = (color: string) => {
    switch (color) {
      case 'green': return 'border-l-green-500';
      case 'orange': return 'border-l-orange-500';
      case 'purple': return 'border-l-purple-500';
      case 'pink': return 'border-l-pink-500';
      case 'indigo': return 'border-l-indigo-500';
      default: return 'border-l-blue-500';
    }
  };
  
  const getActiveClasses = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500 text-white border-green-500 shadow-md';
      case 'orange': return 'bg-orange-500 text-white border-orange-500 shadow-md';
      case 'purple': return 'bg-purple-500 text-white border-purple-500 shadow-md';
      case 'pink': return 'bg-pink-500 text-white border-pink-500 shadow-md';
      case 'indigo': return 'bg-indigo-500 text-white border-indigo-500 shadow-md';
      default: return 'bg-blue-500 text-white border-blue-500 shadow-md';
    }
  };
  
  const getInactiveClasses = (color: string) => {
    switch (color) {
      case 'green': return 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-700 border-gray-200 hover:border-green-200';
      case 'orange': return 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-700 border-gray-200 hover:border-orange-200';
      case 'purple': return 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-700 border-gray-200 hover:border-purple-200';
      case 'pink': return 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-700 border-gray-200 hover:border-pink-200';
      case 'indigo': return 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 border-gray-200 hover:border-indigo-200';
      default: return 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700 border-gray-200 hover:border-blue-200';
    }
  };
  
  const colorAccent = getColorAccent(color);
  const activeClasses = getActiveClasses(color);
  const inactiveClasses = getInactiveClasses(color);
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} border border-l-4 ${colorAccent} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
}