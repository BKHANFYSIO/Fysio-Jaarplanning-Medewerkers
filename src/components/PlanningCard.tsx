import React, { useState } from 'react';
import { 
  AlertTriangle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CalendarPlus, 
  CalendarCheck2 
} from 'lucide-react';
import { PlanningItem } from '../types';
import { filterConfig } from '../config/filters';

interface PlanningCardProps {
  item: PlanningItem;
  showDateDetails?: {
    showStartDate: boolean;
    showEndDate: boolean;
    startDateStr?: string;
    endDateStr?: string;
  };
  onDocumentClick?: (documentName: string, activityTitle: string) => void;
}

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

export function PlanningCard({ item, showDateDetails, onDocumentClick }: PlanningCardProps) {
  const isMiddleOfLongSeries = item.seriesLength && item.seriesLength >= 3 && !item.isFirstInSeries && !item.isLastInSeries;

  const [isExpanded, setIsExpanded] = useState(!isMiddleOfLongSeries);

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

  const handleInstructionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardClick = () => {
    // Only handle card clicks for collapsible cards
    if (isMiddleOfLongSeries && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const hasLink = Boolean(item.link);

  if (isMiddleOfLongSeries && !isExpanded) {
    return (
      <div
        className="bg-gray-50 border-l-4 border-gray-300 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-gray-600">{item.title}</h3>
            {hasLink && <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </div>
          <ChevronDown className="w-5 h-5 text-gray-500 transition-transform" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border-l-4 border-han-red rounded-lg shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden"
    >
      <div className="p-3">
        {/* Top row: dots and phase tags */}
        <div className="flex items-center justify-between mb-2">
          {/* Colored dots for subjects */}
          <div className="flex gap-1.5">
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
            {activePhases.map(phase => {
              const colorClass = phaseColorClasses[phase.color] || phaseColorClasses.gray;
              return (
                <span key={phase.value} className={`${colorClass} px-2 py-0.5 text-xs font-medium rounded`}>
                  {phase.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Title Section */}
        <div 
          className={`flex justify-between items-start gap-2 ${isMiddleOfLongSeries ? 'cursor-pointer' : ''}`}
          onClick={handleToggleExpand}
        >
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-lg leading-tight text-gray-900">{item.title}</h3>
          </div>
          {isMiddleOfLongSeries && (
            <ChevronUp className="w-5 h-5 text-gray-500 transition-transform mt-1 flex-shrink-0" />
          )}
        </div>
        
        {item.description && (
          <p className="text-sm mt-1 mb-2 text-gray-600">{item.description}</p>
        )}
        
        {/* Meta-balk Footer */}
        <div className="text-sm mt-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-gray-600">
              {/* Start Date & Time */}
              <span className={`flex items-center gap-1.5 ${item.isFirstInSeries ? 'font-semibold text-green-600' : 'text-gray-500'}`}>
                <CalendarPlus className="w-4 h-4 flex-shrink-0" />
                {showDateDetails?.startDateStr}
                {item.startTime && <span className="ml-1 text-xs opacity-80">({item.startTime})</span>}
              </span>
              <span className="text-gray-400">→</span>
              {/* End Date & Time */}
              <span className={`flex items-center gap-1.5 ${item.isLastInSeries ? 'font-semibold text-red-600 animate-heartbeat' : 'text-gray-500'}`}>
                <CalendarCheck2 className="w-4 h-4 flex-shrink-0" />
                {showDateDetails?.endDateStr}
                {item.endTime && <span className="ml-1 text-xs opacity-80">({item.endTime})</span>}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-x-4">
              {item.link && (
                <button 
                  onClick={handleInstructionsClick}
                  className="flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Instructies</span>
                </button>
              )}
              {item.deadline && (
                <div className="flex items-center gap-1.5 font-medium text-red-600">
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
}