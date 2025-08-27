import React, { useState } from 'react';
import { 
  AlertTriangle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CalendarPlus, 
  CalendarCheck2,
  Link
} from 'lucide-react';
import { PlanningItem } from '../types';
import { filterConfig } from '../config/filters';
import { InstructionTextModal } from './InstructionTextModal';

interface PlanningCardProps {
  item: PlanningItem;
  type: 'event' | 'ongoing'; // <-- Nieuwe prop
  showDateDetails?: {
    showStartDate: boolean;
    showEndDate: boolean;
    startDateStr?: string;
    endDateStr?: string;
  };
  onDocumentClick?: (documentName: string, activityTitle: string) => void;
}

// Kleine helper component voor een custom tooltip
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  return (
    <div className="relative group flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs
                      px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md shadow-lg
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                      z-10">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-x-4 border-x-transparent
                        border-t-4 border-t-gray-800"></div>
      </div>
    </div>
  );
};

const subjectColors: { [key: string]: string } = {
  waarderen: 'bg-yellow-300',
  juniorstage: 'bg-green-300',
  ipl: 'bg-blue-300',
  bvp: 'bg-orange-300',
  pzw: 'bg-pink-300',
  minor: 'bg-indigo-300',
  getuigschriften: 'bg-gray-300',
  inschrijven: 'bg-teal-300',
  overig: 'bg-slate-300'
};

const phaseColorClasses: { [key: string]: string } = {
  green: 'border border-green-300 bg-green-50 text-green-700',
  orange: 'border border-orange-300 bg-orange-50 text-orange-700',
  purple: 'border border-purple-300 bg-purple-50 text-purple-700',
  gray: 'border border-gray-300 bg-gray-50 text-gray-700',
};

// Find the phase config from the central configuration
const phaseFilterConfig = filterConfig.find(f => f.id === 'phase');

export function PlanningCard({ item, type, showDateDetails }: PlanningCardProps) {
  const isMiddleOfLongSeries = item.seriesLength && item.seriesLength >= 3 && !item.isFirstInSeries && !item.isLastInSeries;

  const [isExpanded, setIsExpanded] = useState(!isMiddleOfLongSeries);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);

  const handleToggleExpand = (e: React.MouseEvent) => {
    if (isMiddleOfLongSeries) {
      e.stopPropagation();
      setIsExpanded(prev => !prev);
    }
  };

  // Get all active subjects
  const activeSubjects = Object.entries(item.subjects)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);
  
  // Get active phases IN THE CORRECT ORDER and with correct labels
  const activePhases = phaseFilterConfig 
    ? phaseFilterConfig.options.filter(option => item.phases[option.value])
    : [];

  const instructionValue = (item.instructions || '').trim();
  const isInstructionUrl = instructionValue.startsWith('http://') || instructionValue.startsWith('https://');

  const handleInstructionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!instructionValue) return;
    if (isInstructionUrl) {
      window.open(instructionValue, '_blank', 'noopener,noreferrer');
    } else {
      setIsInstructionModalOpen(true);
    }
  };

  // Klikken op de kaart wordt alleen gebruikt om ingeklapte doorlopende kaarten te openen

  const hasLink = Boolean(item.instructions || item.link);
  const isHardDeadline = (item.deadline || '').trim().toLowerCase() === 'v';

  if (isMiddleOfLongSeries && !isExpanded) {
    // Styling voor ingeklapte doorlopende kaart (blijft neutraal)
    return (
      <div
        className="bg-gray-50 dark:bg-slate-800/60 border-l-4 border-gray-300 dark:border-slate-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-gray-600 dark:text-slate-300">{item.title}</h3>
            {hasLink && <FileText className="w-4 h-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />}
          </div>
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform" />
        </div>
      </div>
    );
  }

  // Bepaal de dynamische classes op basis van het type
  const cardClasses = type === 'event' 
    ? "bg-white dark:bg-slate-800 border-l-4 border-blue-500 dark:border-blue-500/80 text-gray-900 dark:text-slate-100"
    : "bg-gray-50/70 dark:bg-slate-800/60 text-gray-900 dark:text-slate-100";

  const card = (
    <div 
      className={`${cardClasses} rounded-lg shadow-sm transition-all duration-200 hover:shadow-md relative`}
    >
      <div className="p-3">
        {/* Top row: dots and phase tags */}
        <div className="flex items-center justify-between mb-2">
          {/* Colored dots for subjects */}
          <div className="flex gap-1.5">
            {activeSubjects.slice(0, 6).map((subject) => {
              const colorClass = subjectColors[subject] || 'bg-gray-400';
              const label = subject.charAt(0).toUpperCase() + subject.slice(1);
              return (
                <Tooltip key={subject} content={label}>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${colorClass} shadow-sm`}
                  />
                </Tooltip>
              );
            })}
            {activeSubjects.length > 6 && (
              <Tooltip content={`+${activeSubjects.length - 6} meer`}>
                <div 
                  className="w-2.5 h-2.5 rounded-full bg-gray-300 shadow-sm" 
                />
              </Tooltip>
            )}
          </div>
          {/* Phase tags + hard deadline indicator */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activePhases.map(phase => {
              const colorClass = phaseColorClasses[phase.color] || phaseColorClasses.gray;
              return (
                <span key={phase.value} className={`${colorClass} px-2 py-0.5 text-xs font-medium rounded`}>
                  {phase.label}
                </span>
              );
            })}
            {/* Geen extra icoon hier; alleen in de footer rechts zichtbaar */}
          </div>
        </div>

        {/* Title Section */}
        <div 
          className={`flex justify-between items-start gap-2 ${isMiddleOfLongSeries ? 'cursor-pointer' : ''}`}
          onClick={handleToggleExpand}
        >
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-lg leading-tight text-gray-900 dark:text-slate-100">{item.title}</h3>
          </div>
          {isMiddleOfLongSeries && (
            <ChevronUp className="w-5 h-5 text-gray-500 transition-transform mt-1 flex-shrink-0" />
          )}
        </div>
        
        {item.description && (
          <p className="text-sm mt-1 mb-2 text-gray-600 dark:text-slate-300">{item.description}</p>
        )}
        
        {/* Meta-balk Footer */}
        <div className={`text-sm ${
          item.isLastInSeries 
            ? 'bg-red-100 dark:bg-red-900/20 rounded-b-lg -mx-3 -mb-3 mt-3 px-3 py-2 border-t border-red-200 dark:border-red-800' 
            : 'mt-3 pt-2 border-t border-gray-100 dark:border-slate-700'
        } relative overflow-visible`}>
          {isHardDeadline && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
              <Tooltip content="Deadline (actie vereist)">
                <AlertTriangle className="w-6 h-6 animate-heartbeat" />
              </Tooltip>
            </div>
          )}
          <div className="flex flex-col items-start gap-2 pr-10">
            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300">
              {/* Start Date & Time */}
              <span className={`flex items-center gap-1.5 ${item.isFirstInSeries ? 'font-semibold text-green-600' : 'text-gray-500'}`}>
                <CalendarPlus className="w-4 h-4 flex-shrink-0" />
                {showDateDetails?.startDateStr}
                {item.startTime && <span className="ml-1 text-xs opacity-80">({item.startTime})</span>}
              </span>
              <span className="text-gray-400 dark:text-slate-500">→</span>
              {/* End Date & Time */}
              <span className={`flex items-center gap-1.5 ${item.isLastInSeries ? 'font-semibold text-red-600 dark:text-red-300 animate-heartbeat' : 'text-gray-500 dark:text-slate-400'}`}>
                <CalendarCheck2 className="w-4 h-4 flex-shrink-0" />
                {showDateDetails?.endDateStr}
                {item.endTime && <span className="ml-1 text-xs opacity-80">({item.endTime})</span>}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-x-4">
              {/* Instructies knop */}
              {(item.instructions || item.link) && (
                <button 
                  onClick={handleInstructionsClick}
                  className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Instructies</span>
                </button>
              )}
              
              {/* Links weergave */}
              {item.links && item.links.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {item.links.map((fullLink, index) => {
                    // Parse de titel en de URL uit de link-string
                    const colonIndex = fullLink.indexOf(':');
                    const hasTitle = colonIndex > -1 && !fullLink.substring(colonIndex + 1).startsWith('//');
                    
                    const title = hasTitle ? fullLink.substring(0, colonIndex).trim() : 'Externe link';
                    const url = hasTitle ? fullLink.substring(colonIndex + 1).trim() : fullLink;

                    return (
                      <Tooltip key={index} content={title}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-300 rounded-md hover:text-blue-700 dark:hover:text-blue-200 hover:underline transition-all duration-200 cursor-pointer"
                        >
                          <Link className="w-3 h-3" />
                          <span>{item.links!.length === 1 ? 'link' : `link ${index + 1}`}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
              {/* Geen extra deadline-icoon in de acties; alleen rechts in de footer */}
              {item.deadline && !isHardDeadline && (
                <div className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Deadline: {item.deadline}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {card}
      {(!isInstructionUrl && !!instructionValue) && (
      <InstructionTextModal
        isOpen={isInstructionModalOpen}
        onClose={() => setIsInstructionModalOpen(false)}
        title={item.title}
        text={instructionValue}
      />
      )}
    </>
  );
}