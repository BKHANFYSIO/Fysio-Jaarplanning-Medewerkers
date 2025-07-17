import { Routes, Route } from 'react-router-dom';
import { WeekSection } from './components/WeekSection';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useData } from './hooks/useData';
import { useFilters } from './hooks/useFilters';
import { FilterButton } from './components/FilterButton';
import { filterConfig } from './config/filters';
import { PlanningItem } from './types';
import { useRef } from 'react';
import { WeekInfo } from './types';
import { parseDate } from './utils/dateUtils';

function isSubjects(obj: any): obj is PlanningItem['subjects'] {
  return typeof obj === 'object' && obj !== null;
}

function findClosestFutureWeek(weeks: WeekInfo[]): WeekInfo | null {
  const now = new Date();
  let closestWeek: WeekInfo | null = null;
  let smallestDiff = Infinity;

  weeks.forEach(week => {
    const weekStartDate = parseDate(week.startDate);
    if (weekStartDate && weekStartDate >= now) {
      const diff = weekStartDate.getTime() - now.getTime();
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestWeek = week;
      }
    }
  });

  return closestWeek;
}

function App() {
  const { weeks, planningItems, loading, error } = useData();
  const { activeFilters, toggleFilter, resetFilters } = useFilters();

  const closestWeek = findClosestFutureWeek(weeks);
  const weekRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const scrollToClosestWeek = () => {
    if (closestWeek) {
      const weekKey = `${closestWeek.semester}-${closestWeek.weekCode}`;
      const element = weekRefs.current.get(weekKey);
      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const filteredItems = planningItems.filter(item => {
    // Return true if all active filter categories are met by the item
    return filterConfig.every(config => {
      const selectedOptions = activeFilters[config.id];
      // If no options are selected for this filter, it's considered a pass
      if (!selectedOptions || selectedOptions.length === 0) {
        return true;
      }
      
      // Handle semester filter (direct comparison)
      if (config.dataKey === 'semester') {
        return selectedOptions.includes(String(item.semester));
      } else {
        // Handle phases and subjects filters (checking sub-properties)
        const subObject = item[config.dataKey];
        if (isSubjects(subObject)) {
          return selectedOptions.some(option => subObject[option]);
        }
        return false;
      }
    });
  });

  const itemsByWeek = new Map<string, PlanningItem[]>();
  filteredItems.forEach((item) => {
    const weekKey = `${item.semester}-${item.weekCode}`;
    if (!itemsByWeek.has(weekKey)) {
      itemsByWeek.set(weekKey, []);
    }
    itemsByWeek.get(weekKey)!.push(item);
  });

  if (loading) return <p>Laden...</p>;
  if (error) return <p>Error: {error}</p>;

  const Home = () => (
    <div className="container p-4 mx-auto">
      <h1 className="my-4 text-2xl font-bold text-center">Jaarplanning Fysiotherapie</h1>
      
      {/* Dynamic Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            {filterConfig.map(config => (
              <div key={config.id} className="mb-4">
                <h3 className="mb-2 font-semibold">{config.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {config.options.map(option => (
                    <FilterButton
                      key={option.value}
                      label={option.label}
                      isActive={activeFilters[config.id]?.includes(option.value)}
                      onClick={() => toggleFilter(config.id, option.value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={scrollToClosestWeek} className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Ga naar eerstvolgende week</button>
            <button onClick={resetFilters} className="px-4 py-2 text-sm text-white bg-gray-500 rounded hover:bg-gray-600">Reset Filters</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {weeks.map((week) => {
          const weekKey = `${week.semester}-${week.weekCode}`;
          return (
            <div key={weekKey} ref={el => weekRefs.current.set(weekKey, el)}>
              <WeekSection
                week={week}
                items={itemsByWeek.get(weekKey) || []}
                onDocumentClick={() => {}} // Placeholder for now
                isClosest={closestWeek?.weekCode === week.weekCode && closestWeek?.semester === week.semester}
              />
            </div>
          )
        })}
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;