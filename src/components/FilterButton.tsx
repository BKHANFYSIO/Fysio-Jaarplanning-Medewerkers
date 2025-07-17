import React from 'react';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

const colorClasses = {
  // Mapping from color names in config to Tailwind classes
  green: { bg: 'bg-green-100', text: 'text-green-800' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-800' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-800' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-800' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-800' },
};

export const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onClick, color }) => {
  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  const baseClasses = "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200";
  const colorStyle = `${selectedColor.bg} ${selectedColor.text}`;
  const activeClasses = `ring-2 ring-han-red ring-offset-2`;
  const inactiveClasses = "opacity-70 hover:opacity-100";

  return (
    <button
      type="button"
      className={`${baseClasses} ${colorStyle} ${isActive ? activeClasses : inactiveClasses}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};