import { Routes, Route } from 'react-router-dom';
import { WeekSection } from './components/WeekSection';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useData } from './hooks/useData';
import { useFilters } from './hooks/useFilters';
import { FilterButton } from './components/FilterButton';
import { filterConfig } from './config/filters';
import { PlanningItem, WeekInfo } from './types';
import { useRef, useMemo, useState } from 'react';
import { parseDate } from './utils/dateUtils';
import { Filter, RotateCcw, LocateFixed, ChevronDown } from 'lucide-react';

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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Calculate which filter options have corresponding items
  const availableOptions = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    filterConfig.forEach(config => {
      counts[config.id] = {};
      config.options.forEach(option => {
        counts[config.id][option.value] = 0;
      });
    });

    planningItems.forEach(item => {
      filterConfig.forEach(config => {
        const itemValue = item[config.dataKey];
        if (config.dataKey === 'semester' && itemValue) {
            // Not implemented yet, would handle semester counts
        } else if (typeof itemValue === 'object' && itemValue !== null) {
          Object.keys(itemValue).forEach(key => {
            if (itemValue[key] === true && counts[config.id]?.[key] !== undefined) {
              counts[config.id][key]++;
            }
          });
        }
      });
    });
    return counts;
  }, [planningItems]);

  const closestWeek = findClosestFutureWeek(weeks);
  const weekRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const headerRef = useRef<HTMLElement | null>(null); // Ref for the header element

  const scrollToClosestWeek = () => {
    if (closestWeek) {
      const weekKey = `${closestWeek.semester}-${closestWeek.weekCode}`;
      const element = weekRefs.current.get(weekKey);
      
      if (element && headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerHeight - 20; // 20px extra margin

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
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
    <div className="bg-slate-50 min-h-screen">
      <div className="container p-4 mx-auto">
        <header ref={headerRef} className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <img src="/images/Logo-HAN.webp" alt="HAN Logo" className="h-10 md:h-12"/>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Jaarplanning Fysiotherapie</h1>
            </div>
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800"
              >
                <Filter size={16}/>
                <span>Filters & Opties</span>
                <ChevronDown size={16} className={`transition-transform ${isMobileFiltersOpen ? 'rotate-180' : ''}`}/>
              </button>
            </div>
          </div>

          {/* Control Bar - now inside the sticky header */}
          <div className={`
            ${isMobileFiltersOpen ? 'block' : 'hidden'} 
            lg:block
          `}>
            <div className="p-4 mt-2 bg-white rounded-lg shadow-md">
              {/* Filters */}
              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                {filterConfig.map(config => (
                  <div key={config.id} className="mr-4">
                    <h3 className="mb-2 text-base font-semibold text-gray-700">{config.label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {config.options.map(option => {
                        if (availableOptions[config.id]?.[option.value] > 0) {
                          return (
                            <FilterButton
                              key={option.value}
                              label={option.label}
                              color={option.color}
                              isActive={activeFilters[config.id]?.includes(option.value)}
                              onClick={() => toggleFilter(config.id, option.value)}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-1"/>

              {/* Action Buttons */}
              <div className="flex flex-col items-start gap-2 sm:flex-row">
                <button onClick={scrollToClosestWeek} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg sm:w-auto hover:bg-blue-700"> <LocateFixed size={16}/> Eerstvolgende week</button>
                <button onClick={resetFilters} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg sm:w-auto hover:bg-gray-300"> <RotateCcw size={16}/> Reset Filters</button>
              </div>
            </div>
          </div>
        </header>

         {/* Main Content Grid */}
         {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="p-4 space-y-4 bg-white rounded-lg shadow-sm animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
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