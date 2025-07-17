import React from 'react';
import { PlanningCard } from './PlanningCard';
import { PlanningItem, WeekInfo } from '../types';
import { parseDate, shouldShowDateDetails } from '../utils/dateUtils';

interface WeekSectionProps {
  week: WeekInfo;
  items: PlanningItem[];
  onDocumentClick?: (documentName: string, activityTitle: string) => void;
  isClosest?: boolean;
}

export function WeekSection({ week, items, onDocumentClick, isClosest = false }: WeekSectionProps) {
  const weekStartDate = parseDate(week.startDate);
  
  if (week.isVacation) {
    return (
      <div className="mb-8">
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {week.weekLabel}
          </h2>
          <p className="text-gray-500">Geen activiteiten gepland</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 ${
        isClosest 
          ? 'text-green-600 border-green-200 bg-green-50 px-4 py-2 rounded-t-lg' 
          : 'text-blue-600 border-blue-200'
      }`}>
        {week.weekLabel} ({week.startDate})
        {isClosest && (
          <span className="ml-3 text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Eerstvolgende
          </span>
        )}
      </h2>
      
      {items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
          Geen activiteiten deze week
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const startDate = parseDate(item.startDate);
            const endDate = parseDate(item.endDate);
            
            let dateDetails;
            if (weekStartDate && startDate && endDate) {
              dateDetails = shouldShowDateDetails(startDate, endDate, weekStartDate);
            }
            
            return (
              <PlanningCard
                key={`${item.title}-${index}`}
                item={item}
                showDateDetails={dateDetails}
                onDocumentClick={onDocumentClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}