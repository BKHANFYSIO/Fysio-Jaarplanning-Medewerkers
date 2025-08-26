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

interface GroupHeaderProps {
  title: string;
  isCollapsed: boolean;
  onToggle: (event: React.MouseEvent) => void;
  count: number;
  showChevron?: boolean;
  variant: 'doorlopend' | 'start-eind';
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ title, isCollapsed, onToggle, count, showChevron = true, variant }) => {
  const headerClasses = {
    base: 'p-2 rounded-t-lg transition-colors duration-200',
    'start-eind': 'bg-blue-50 border-b-2 border-blue-100',
    'doorlopend': ''
  };
  const iconClasses = {
    base: 'w-4 h-4 mr-2',
    'start-eind': 'text-blue-600',
    'doorlopend': 'text-gray-500'
  };
  const titleClasses = {
    base: 'text-xs font-bold tracking-wider uppercase',
    'start-eind': 'text-blue-800',
    'doorlopend': 'text-gray-500 group-hover:text-gray-700'
  };
  
  const Icon = variant === 'start-eind' ? CalendarDays : Repeat;

  return (
    <div className={`mt-4 first:mt-0 ${headerClasses[variant]}`}>
      <button
        type="button"
        className={`flex items-center justify-between w-full text-left ${showChevron ? 'cursor-pointer group' : ''}`}
        onClick={showChevron ? onToggle : undefined}
        disabled={!showChevron}
      >
        <div className="flex items-center">
          <Icon className={`${iconClasses.base} ${iconClasses[variant]}`} />
          <h4 className={titleClasses.base + ' ' + titleClasses[variant]}>{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{count}</span>}
          {showChevron && (isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600"/> : <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600"/>)}
        </div>
      </button>
      {variant === 'doorlopend' && <hr className="mt-1 mb-2"/>}
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
      <div className={`transition-all duration-300 ${isHighlighted ? 'bg-green-50/70 border-l-4 border-green-400 rounded-r-lg shadow-sm p-4 mb-8' : 'mb-8'}`}>
        <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 ${isHighlighted ? 'text-green-800 border-green-200' : 'text-gray-600 border-gray-300'}`}>
          {week.weekLabel} ({week.startDate})
          {highlightLabel && (
            <span className="ml-3 text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
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
    <div className={`transition-all duration-300 ${isHighlighted ? 'bg-green-50/70 border-l-4 border-green-400 rounded-r-lg shadow-sm p-4 mb-8' : 'mb-8'}`}>
      <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 ${
        isHighlighted 
          ? 'text-green-800 border-green-200' 
          : 'text-blue-600 border-blue-200'
      }`}>
        {week.weekLabel} ({week.startDate})
        {highlightLabel && (
          <span className="ml-3 text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
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

            const renderItem = (item: PlanningItem, index: number, type: 'doorlopend' | 'start-eind') => {
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

              return (
                <PlanningCard
                  key={`${item.title}-${index}`}
                  item={item}
                  itemType={type}
                  showDateDetails={dateDetails}
                  onDocumentClick={onDocumentClick}
                />
              );
            };

            return (
              <>
                {doorlopendeActiviteiten.length > 0 && (
                  <div>
                    <GroupHeader 
                      title="Doorlopende Activiteiten" 
                      variant="doorlopend"
                      isCollapsed={isLopendeZakenCollapsed}
                      onToggle={handleToggle}
                      count={doorlopendeActiviteiten.length}
                    />
                    {!isLopendeZakenCollapsed && 
                      <div className="flex flex-col gap-4 pt-2">
                        {doorlopendeActiviteiten.map((item, index) => renderItem(item, index, 'doorlopend'))}
                      </div>
                    }
                  </div>
                )}
                {startEnEindmomentenActiviteiten.length > 0 && (
                  <div className="mt-4">
                    <GroupHeader 
                      title="Start- & Eindmomenten Activiteiten" 
                      variant="start-eind"
                      isCollapsed={false} // This section is never collapsible
                      onToggle={() => {}} // No-op
                      count={startEnEindmomentenActiviteiten.length}
                      showChevron={false}
                    />
                    <div className="flex flex-col gap-4 pt-2">
                      {startEnEindmomentenActiviteiten.map((item, index) => renderItem(item, index, 'start-eind'))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}