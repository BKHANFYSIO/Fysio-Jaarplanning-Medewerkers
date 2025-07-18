import React from 'react';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
  variant?: 'solid' | 'outline';
}

const colorClasses = {
  // Mapping from color names in config to Tailwind classes
  green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hoverBg: 'hover:bg-green-100' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', hoverBg: 'hover:bg-orange-100' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', hoverBg: 'hover:bg-purple-100' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', hoverBg: 'hover:bg-pink-100' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', hoverBg: 'hover:bg-indigo-100' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', hoverBg: 'hover:bg-blue-100' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', hoverBg: 'hover:bg-yellow-100' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', hoverBg: 'hover:bg-gray-100' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', hoverBg: 'hover:bg-teal-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', hoverBg: 'hover:bg-slate-100' },
};

export const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onClick, color, variant = 'solid' }) => {
  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  const baseClasses = "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200";

  let styleClasses = '';
  if (variant === 'outline') {
    const borderBase = "border";
    const active = `${selectedColor.bg} ${selectedColor.text} ${selectedColor.border} ring-2 ring-han-red ring-offset-2`;
    const inactive = `bg-transparent ${selectedColor.text} ${selectedColor.border} ${selectedColor.hoverBg} hover:opacity-100`;
    styleClasses = `${borderBase} ${isActive ? active : inactive}`;
  } else { // solid
    const solidBase = `${selectedColor.bg} ${selectedColor.text}`;
    const active = `ring-2 ring-han-red ring-offset-2`;
    const inactive = `opacity-70 hover:opacity-100`;
    styleClasses = `${solidBase} ${isActive ? active : inactive}`;
  }

  return (
    <button
      type="button"
      className={`${baseClasses} ${styleClasses}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};