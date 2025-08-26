import React, { useState } from 'react';
import { PlanningItem } from '../types';
import { ChevronDown, ChevronUp, Link as LinkIcon, Calendar, Clock, Star, Circle, CheckCircle, ExternalLink, FileText, CalendarPlus, CalendarCheck2, AlertTriangle } from 'lucide-react';
import { filterConfig } from '../config/filters';
import { Tooltip } from './Tooltip'; // Assuming you have a Tooltip component

type CardVariant = 'default' | 'ongoing';

interface PlanningCardProps {
  item: PlanningItem;
  showDateDetails: {
    showStartDate: boolean;
    showEndDate: boolean;
    startDateStr: string;
    endDateStr: string;
  };
  onDocumentClick?: (documentName: string, activityTitle: string) => void;
  variant?: CardVariant;
}

const subjectColors: { [key: string]: string } = {
  waarderen: 'bg-teal-400',
  juniorstage: 'bg-cyan-400',
  ipl: 'bg-sky-400',
  bvp: 'bg-blue-400',
  pzw: 'bg-indigo-400',
  minor: 'bg-purple-400',
  getuigschriften: 'bg-fuchsia-400',
  inschrijven: 'bg-pink-400',
  overig: 'bg-rose-400',
};

const phaseConfig = filterConfig.find(f => f.id === 'phases');
const phaseColorClasses: { [key: string]: string } = phaseConfig ? phaseConfig.options.reduce((acc, option) => {
  acc[option.value] = option.color || 'bg-gray-200 text-gray-800';
  return acc;
}, {} as { [key: string]: string }) : {};


export const PlanningCard: React.FC<PlanningCardProps> = ({ item, showDateDetails, onDocumentClick, variant = 'default' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { title, description, instructions, deadline, links, subjects, phases } = item;

  const hasContentToExpand = instructions || (links && links.length > 0);

  const activeSubjects = subjects ? Object.keys(subjects).filter(key => subjects[key]) : [];
  const activePhases = phases ? Object.keys(phases).filter(key => phases[key]) : [];

  const cardBaseClasses = "relative w-full text-left bg-white rounded-lg shadow-sm transition-shadow duration-200 hover:shadow-md";
  const cardVariantClasses = {
    default: "border-l-4 border-blue-500",
    ongoing: "bg-gray-50 border-none"
  };

  const toggleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (hasContentToExpand) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLButtonElement>, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className={`${cardBaseClasses} ${cardVariantClasses[variant]}`}>
      <div className="p-3">
         {/* Top row: dots and phase tags */}
         <div className="flex items-center justify-between mb-2">
           {/* Colored dots for subjects */}
           <div className="flex items-center gap-1.5 min-h-[10px]">
             {activeSubjects.slice(0, 6).map((subject) => {
               const colorClass = subjectColors[subject] || 'bg-gray-400';
               return (
                 <div
                   key={subject}
                   className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-sm`}
                   title={subject.charAt(0).toUpperCase() + subject.slice(1)}
                 />
               );
             })}
             {activeSubjects.length > 6 && (
               <div 
                 className="w-2.5 h-2.5 rounded-full bg-gray-300 shadow-sm" 
                 title={`+${activeSubjects.length - 6} meer`}
               />
             )}
           </div>
           {/* Phase tags */}
           <div className="flex flex-wrap items-center gap-1">
             {activePhases.map(phaseKey => {
                const phaseOption = phaseConfig?.options.find(o => o.value === phaseKey);
                if (!phaseOption) return null;
                const colorClass = phaseOption.color || 'bg-gray-200 text-gray-800';
               return (
                 <span key={phaseKey} className={`${colorClass} px-2 py-0.5 text-xs font-medium rounded`}>
                   {phaseOption.label}
                 </span>
               );
             })}
           </div>
         </div>
        
        {/* Title */}
        <h3 className="font-semibold text-base leading-tight text-gray-900">{title}</h3>
        
        {/* Description */}
        {description && (
          <p className="text-sm mt-1 text-gray-600">{description}</p>
        )}
        
        {/* Meta Footer */}
        <div className="text-sm mt-2 pt-2 border-t border-gray-100">
           <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              {/* Date Range */}
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className={`flex items-center gap-1.5 ${item.isFirstInSeries ? 'font-semibold text-green-600' : ''}`}>
                  <CalendarPlus className="w-4 h-4 flex-shrink-0" />
                  {showDateDetails.startDateStr}
                  {item.startTime && <span className="ml-1 text-xs opacity-80">({item.startTime})</span>}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`flex items-center gap-1.5 ${item.isLastInSeries ? 'font-semibold text-red-600' : ''}`}>
                  <CalendarCheck2 className="w-4 h-4 flex-shrink-0" />
                  {showDateDetails.endDateStr}
                  {item.endTime && <span className="ml-1 text-xs opacity-80">({item.endTime})</span>}
                </span>
              </div>
           </div>
        </div>
      </div>
      
      {/* Expandable Button */}
      {hasContentToExpand && (
        <button 
          onClick={toggleExpand} 
          className="absolute top-0 right-0 h-full w-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-r-lg"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Details inklappen" : "Details uitklappen"}
        >
          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="p-3 mt-2 border-t border-gray-200 bg-gray-50/50 rounded-md">
            {instructions && (
              <div>
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-1">
                  <FileText className="w-4 h-4"/>
                  Instructies
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{instructions}</p>
              </div>
            )}
            {links && links.length > 0 && (
              <div className={instructions ? 'mt-3' : ''}>
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-1">
                  <LinkIcon className="w-4 h-4"/>
                  Links
                </h4>
                <div className="flex flex-col items-start gap-1">
                  {links.map((fullLink, index) => {
                    const colonIndex = fullLink.indexOf(':');
                    const hasTitle = colonIndex > -1 && !fullLink.substring(colonIndex + 1).startsWith('//');
                    const title = hasTitle ? fullLink.substring(0, colonIndex).trim() : 'Externe link';
                    const url = hasTitle ? fullLink.substring(colonIndex + 1).trim() : fullLink;
                    return (
                      <button
                        key={index}
                        onClick={(e) => handleLinkClick(e, url)}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline hover:text-blue-700"
                      >
                        <span>{title}</span>
                        <ExternalLink className="w-3.5 h-3.5"/>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};