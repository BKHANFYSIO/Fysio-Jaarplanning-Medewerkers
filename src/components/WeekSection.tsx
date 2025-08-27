import React from 'react';
import { PlanningCard } from './PlanningCard';
import { PlanningItem, WeekInfo } from '../types';
import { parseDate } from '../utils/dateUtils';
import { ChevronDown, ChevronUp, CalendarDays, Repeat } from 'lucide-react';

interface WeekSectionProps {
  week: WeekInfo;
  items: PlanningItem[];
  onDocumentClick?: (documentName: string, activityTitle: string) => void;
  highlightLabel?: string | null;
  isLopendeZakenCollapsed: boolean;
  onToggleLopendeZaken: () => void;
}

const getItemPriority = (item: PlanningItem): number => {
  if (item.deadline) return 1;
  // A standalone item is both first and last
  if (item.isFirstInSeries && item.isLastInSeries) return 2; 
  if (item.isFirstInSeries) return 3;
  if (item.isLastInSeries) return 4;
  return 5; // Doorlopende Activiteiten (ingeklapt)
};

const GroupHeader = ({ 
  title, 
  isCollapsed, 
  onToggle, 
  count, 
  showChevron = true,
  type
}: { 
  title: string, 
  isCollapsed: boolean, 
  onToggle: (event: React.MouseEvent) => void, 
  count: number, 
  showChevron?: boolean,
  type: 'event' | 'ongoing'
}) => {
  const isEvent = type === 'event';
  const Icon = isEvent ? CalendarDays : Repeat;

  return (
    <div className={`mt-4 first:mt-0 rounded-lg ${isEvent ? 'bg-blue-50/70 p-2' : ''}`}>
      <button
        type="button"
        className={`flex items-center justify-between w-full text-left ${showChevron ? 'cursor-pointer group' : ''}`}
        onClick={showChevron ? onToggle : undefined}
        disabled={!showChevron}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isEvent ? 'text-blue-600' : 'text-gray-500'}`} />
          <h4 className={`text-xs font-bold tracking-wider uppercase ${isEvent ? 'text-blue-800' : 'text-gray-500 group-hover:text-gray-700'}`}>{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">{count}</span>}
          {showChevron && (isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600"/> : <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600"/>)}
        </div>
      </button>
      {!isEvent && <hr className="mt-1 mb-2"/>}
    </div>
  );
};

export function WeekSection({ week, items, onDocumentClick, highlightLabel = null, isLopendeZakenCollapsed, onToggleLopendeZaken }: WeekSectionProps) {
  const weekStartDate = parseDate(week.startDate);
  
  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    onToggleLopendeZaken();
  };
  const isHighlighted = !!highlightLabel;

  if (week.isVacation) {
    return (
      <div className={`transition-all duration-300 ${isHighlighted ? 'bg-gradient-to-r from-green-50 via-green-50/60 to-transparent dark:from-green-900/25 dark:via-green-900/10 dark:to-transparent border-l-4 border-green-400 rounded-r-lg shadow-sm p-4 mb-8' : 'mb-8'}`}>
        <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 ${isHighlighted ? 'text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' : 'text-gray-600 border-gray-300'}`}>
          {week.weekLabel} ({week.startDate})
          {highlightLabel && (
            <span className="ml-3 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border dark:border-green-800 px-2 py-1 rounded-full">
              {highlightLabel}
            </span>
          )}
        </h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {week.weekLabel}
          </h3>
          <p className="text-gray-500">Geen activiteiten gepland</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`transition-all duration-300 ${isHighlighted ? 'bg-gradient-to-r from-green-50 via-green-50/60 to-transparent dark:from-green-900/25 dark:via-green-900/10 dark:to-transparent border-l-4 border-green-400 rounded-r-lg shadow-sm p-4 mb-8' : 'mb-8'}`}>
      <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 ${
        isHighlighted 
          ? 'text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' 
          : 'text-blue-600 border-blue-200'
      }`}>
        {week.weekLabel} ({week.startDate})
        {highlightLabel && (
          <span className="ml-3 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border dark:border-green-800 px-2 py-1 rounded-full">
            {highlightLabel}
          </span>
        )}
      </h2>
      
      {items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
          Geen activiteiten deze week
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(() => {
            const sortedItems = [...items].sort((a, b) => {
              const priorityA = getItemPriority(a);
              const priorityB = getItemPriority(b);
              if (priorityA !== priorityB) return priorityA - priorityB;
              return a.title.localeCompare(b.title); // Fallback to alphabetical for same priority
            });

            const startEnEindmomentenActiviteiten = sortedItems.filter(item => getItemPriority(item) < 5);
            const doorlopendeActiviteiten = sortedItems.filter(item => getItemPriority(item) === 5);

            const renderItem = (item: PlanningItem, index: number) => {
              const startDate = parseDate(item.startDate);
              const endDate = parseDate(item.endDate);
              const formattedStartDate = startDate ? `${startDate.getDate()}-${startDate.toLocaleString('nl-NL', { month: 'short' })}` : '';
              const formattedEndDate = endDate ? `${endDate.getDate()}-${endDate.toLocaleString('nl-NL', { month: 'short' })}` : '';
              
              const dateDetails = {
                showStartDate: true,
                showEndDate: true,
                startDateStr: formattedStartDate,
                endDateStr: formattedEndDate,
              };

              // Bepaal het type kaart
              const cardType = getItemPriority(item) < 5 ? 'event' : 'ongoing';

              return (
                <PlanningCard
                  key={`${item.title}-${index}`}
                  item={item}
                  type={cardType}
                  showDateDetails={dateDetails}
                  onDocumentClick={onDocumentClick}
                />
              );
            };

            return (
              <>
                {doorlopendeActiviteiten.length > 0 && (
                  <>
                    <GroupHeader 
                      title="Doorlopende Activiteiten" 
                      isCollapsed={isLopendeZakenCollapsed}
                      onToggle={handleToggle}
                      count={doorlopendeActiviteiten.length}
                      type="ongoing"
                    />
                    {!isLopendeZakenCollapsed && doorlopendeActiviteiten.map(renderItem)}
                  </>
                )}
                {startEnEindmomentenActiviteiten.length > 0 && (
                  <>
                    <GroupHeader 
                      title="Start- & Eindmomenten Activiteiten" 
                      isCollapsed={false} // This section is never collapsible
                      onToggle={() => {}} // No-op
                      count={startEnEindmomentenActiviteiten.length}
                      showChevron={false}
                      type="event"
                    />
                    {startEnEindmomentenActiviteiten.map(renderItem)}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}