import React from 'react';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  softDisabled?: boolean; // visueel disabled + tooltip, maar nog klikbaar
  count?: number; // optioneel teller-badge
  compact?: boolean; // maak knoppen compacter op laptop
}

const colorClasses = {
  // Mapping from color names in config to Tailwind classes
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700', hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/40' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700', hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/40' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700', hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/40' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700', hoverBg: 'hover:bg-pink-100 dark:hover:bg-pink-900/40' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700', hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700', hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/40' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-700', hoverBg: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-700', hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-700' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-300 dark:border-teal-700', hoverBg: 'hover:bg-teal-100 dark:hover:bg-teal-900/40' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700', hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700', hoverBg: 'hover:bg-red-100 dark:hover:bg-red-900/40' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700', hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700', hoverBg: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/40' },
};

export const FilterButton: React.FC<FilterButtonProps> = ({ 
  label, 
  isActive, 
  onClick, 
  color, 
  variant = 'solid',
  disabled = false,
  disabledReason,
  className = '',
  softDisabled = false,
  count,
  compact = false,
}) => {
  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  const baseClasses = `px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${compact ? 'lg:px-2 lg:py-1 lg:text-xs' : ''}`;

  let styleClasses = '';
  if (disabled) {
    // Hard disabled: niet klikbaar
    styleClasses = `bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50`;
  } else if (variant === 'outline') {
    const borderBase = "border";
    const colorBase = softDisabled ? 'text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700' : `${selectedColor.text} ${selectedColor.border}`;
    const bgActive = softDisabled ? 'bg-gray-100 dark:bg-gray-800' : selectedColor.bg;
    const active = `${bgActive} ${colorBase} ring-2 ring-han-red ring-offset-2 border-2 border-blue-500 dark:border-blue-400`;
    const inactiveHover = softDisabled ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : selectedColor.hoverBg;
    const inactiveEmphasis = !softDisabled && typeof count === 'number' && count > 0 ? 'opacity-100' : '';
    const inactive = `bg-transparent ${colorBase} ${inactiveHover} ${inactiveEmphasis}`;
    styleClasses = `${borderBase} ${isActive ? active : inactive}`;
  } else { // solid
    const solidBase = softDisabled ? `bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400` : `${selectedColor.bg} ${selectedColor.text}`;
    const active = `ring-2 ring-han-red ring-offset-2 border-2 border-blue-500 dark:border-blue-400`;
    const inactive = (!softDisabled && typeof count === 'number' && count > 0) ? 'opacity-100' : 'opacity-70 hover:opacity-100';
    styleClasses = `${solidBase} ${isActive ? active : inactive}`;
  }

  const button = (
    <button
      type="button"
      className={`${baseClasses} ${styleClasses} ${className}`}
      onClick={(disabled ? undefined : onClick)}
      disabled={disabled}
      title={(disabled || softDisabled) ? disabledReason : undefined}
    >
      <span className="inline-flex items-center gap-0.5">
        <span className={softDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-slate-100'}>{label}</span>
        {typeof count === 'number' && (
          <span className={`ml-0.5 inline-flex items-center justify-center text-[10px] leading-none px-1 py-0 rounded-full bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200 -translate-y-0.5 ${softDisabled ? 'opacity-60' : ''}`}>
            {count}
          </span>
        )}
      </span>
    </button>
  );

  // Als disabled en er is een reden, wrap in een div met tooltip
  if ((disabled || softDisabled) && disabledReason) {
    return (
      <div className="relative group">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {disabledReason}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      </div>
    );
  }

  return button;
};