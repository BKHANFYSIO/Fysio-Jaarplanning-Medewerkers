import React from 'react';
import { Clock, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { PlanningItem } from '../types';

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
  waarderen: 'purple-500',
  juniorstage: 'green-500',
  ipl: 'blue-500',
  bvp: 'orange-500',
  pzw: 'pink-500',
  minor: 'indigo-500',
  getuigschriften: 'yellow-500',
  inschrijven: 'cyan-500',
  overig: 'gray-400'
};

const phaseColors: { [key: string]: string } = {
  p: 'bg-green-100 text-green-700',
  h1: 'bg-orange-100 text-orange-700',
  h2h3: 'bg-purple-100 text-purple-700'
};

export function PlanningCard({ item, showDateDetails, onDocumentClick }: PlanningCardProps) {
  // Get all active subjects
  const activeSubjects = Object.entries(item.subjects)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);
  
  // Get active phases
  const activePhases = Object.entries(item.phases)
    .filter(([_, value]) => value)
    .map(([key, _]) => key.toUpperCase());

  const handleCardClick = () => {
    if (item.link && onDocumentClick) {
      onDocumentClick(item.link, item.title);
    }
  };

  const hasLink = Boolean(item.link);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden">
      <div 
        className={`p-4 ${
          hasLink 
            ? 'hover:bg-gray-50 cursor-pointer' 
            : ''
        }`}
        onClick={handleCardClick}
      >
        {/* Colored dots for subjects */}
        {activeSubjects.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {activeSubjects.slice(0, 6).map((subject) => {
              const colorClass = subjectColors[subject] || 'gray-400';
              return (
                <div
                  key={subject}
                  className={`w-2.5 h-2.5 rounded-full bg-${colorClass} shadow-sm`}
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
        )}

        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 flex-1">
            <h3 className="font-semibold text-lg leading-tight text-gray-900">{item.title}</h3>
            {hasLink && (
              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {activePhases.map(phase => {
              const phaseKey = phase.toLowerCase() === 'h2/3' ? 'h2h3' : phase.toLowerCase();
              const colorClass = phaseColors[phaseKey] || 'bg-gray-100 text-gray-700';
              return (
                <span key={phase} className={`${colorClass} px-2 py-1 rounded text-xs font-medium`}>
                  {phase}
                </span>
              );
            })}
          </div>
        </div>
        
        {item.description && (
          <p className="text-sm mb-3 text-gray-600">{item.description}</p>
        )}
        
        <div className="space-y-2">
          {(showDateDetails?.showStartDate || showDateDetails?.showEndDate || item.startTime || item.endTime) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {showDateDetails?.showStartDate && `Start: ${showDateDetails.startDateStr}`}
                {showDateDetails?.showStartDate && showDateDetails?.showEndDate && ' • '}
                {showDateDetails?.showEndDate && `Eind: ${showDateDetails.endDateStr}`}
                {(item.startTime || item.endTime) && (
                  <>
                    {(showDateDetails?.showStartDate || showDateDetails?.showEndDate) && ' • '}
                    {item.startTime && `${item.startTime}`}
                    {item.startTime && item.endTime && '-'}
                    {item.endTime && `${item.endTime}`}
                  </>
                )}
              </span>
            </div>
          )}
          
          {item.deadline && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-red-700">Deadline: {item.deadline}</span>
            </div>
          )}

          {hasLink && (
            <div className="flex items-center gap-2 text-sm font-medium mt-3 pt-2 border-t border-gray-200">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Instructies en uitleg beschikbaar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}