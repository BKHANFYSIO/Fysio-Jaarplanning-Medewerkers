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
import { useRef, useMemo, useState, useLayoutEffect } from 'react';
import { parseDate } from './utils/dateUtils';
import { exportToExcel } from './utils/excelParser';
import { Filter, RotateCcw, LocateFixed, ChevronDown, ChevronUp, HelpCircle, QrCode, Sun, Moon, Link, Download } from 'lucide-react';
import { HelpModal } from './components/HelpModal';
import { DevelopmentBanner } from './components/DevelopmentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChangesBanner } from './components/ChangesBanner';
import { QRModal } from './components/QRModal';
import { SnelkoppelingenModal } from './components/SnelkoppelingenModal';
import { useSnelkoppelingen } from './hooks/useSnelkoppelingen';

interface TopWeekInfo {
  key: string;
  position: number;
}

function isSubjects(obj: any): obj is PlanningItem['subjects'] {
  return typeof obj === 'object' && obj !== null;
}

// Home component now defined outside of App
const Home = ({
  bannerVisibility,
  handleCloseDevBanner,
  handleCloseChangesBanner,
  headerRef,
  bannersRef,
  isMobileFiltersOpen,
  setIsMobileFiltersOpen,
  setIsQrOpen,
  isDark,
  toggleDark,
  effectiveFilterConfig,
  availableOptions,
  activeFilters,
  handleToggleFilter,
  scrollToTargetWeek,
  targetWeekInfo,
  handleResetFilters,
  toggleAllLopendeZaken,
  areAllLopendeZakenCollapsed,
  setIsHelpModalOpen,
  loading,
  weeks,
  itemsByWeek,
  weekRefs,
  toggleSectionCollapse,
  collapsedSections,
  snelkoppelingen,
  groepen,
  isSnelkoppelingenOpen,
  setIsSnelkoppelingenOpen,
  handleDownloadActivities,
}: any) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
    <div ref={bannersRef} className="sticky top-0 z-50">
      {bannerVisibility.development && <DevelopmentBanner onClose={handleCloseDevBanner} />}
      {bannerVisibility.changes && <ChangesBanner onClose={handleCloseChangesBanner} />}
    </div>
    <div className="container p-4 mx-auto">
      <header ref={headerRef} className="sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-900/90 backdrop-blur-sm">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <img src="/images/Logo-HAN.webp" alt="HAN Logo" className="h-10 md:h-12"/>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">Jaarplanning Fysiotherapie <span className="text-red-600 animate-heartbeat">(Medewerkers)</span></h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Snelkoppelingen Button */}
            <button 
              onClick={() => setIsSnelkoppelingenOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Snelkoppelingen"
            >
              <Link size={16}/>
              <span>Links</span>
            </button>
            {/* Download Button */}
            <button 
              onClick={handleDownloadActivities}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Download activiteiten als Excel"
            >
              <Download size={16}/>
              <span>Download</span>
            </button>
            {/* Help Button */}
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Uitleg"
            >
              <HelpCircle size={16}/>
              <span>Uitleg</span>
            </button>
            {/* QR Button (desktop only) */}
            <button 
              onClick={() => setIsQrOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Toon QR"
            >
              <QrCode size={16}/>
              <span>QR</span>
            </button>
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
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <img src="/images/Logo-HAN.webp" alt="HAN Logo" className="h-8"/>
              <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Jaarplanning Fysiotherapie <span className="text-red-600 animate-heartbeat">(Medewerkers)</span></h1>
            </div>
            {/* Compact Icon Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSnelkoppelingenOpen(true)}
                className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                title="Snelkoppelingen"
              >
                <Link size={18}/>
              </button>
              <button 
                onClick={handleDownloadActivities}
                className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                title="Download activiteiten als Excel"
              >
                <Download size={18}/>
              </button>
              <button 
                onClick={() => setIsHelpModalOpen(true)}
                className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                title="Uitleg"
              >
                <HelpCircle size={18}/>
              </button>
              <button 
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="flex items-center justify-center w-10 h-10 text-white bg-gray-700 rounded-full hover:bg-gray-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
                title="Filters & Opties"
              >
                <Filter size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* Control Bar - now inside the sticky header */}
        <div className={`
          ${isMobileFiltersOpen ? 'block' : 'hidden'} 
          lg:block
        `}
          onTouchStart={(e) => {
            (Home as any).paneTouchStartX = e.touches[0].clientX;
            (Home as any).paneTouchStartY = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const sx = (Home as any).paneTouchStartX as number | undefined;
            const sy = (Home as any).paneTouchStartY as number | undefined;
            if (typeof sx === 'number' && typeof sy === 'number') {
              const dx = e.changedTouches[0].clientX - sx;
              const dy = e.changedTouches[0].clientY - sy;
              if ((dx > 60 || dx < -60) && Math.abs(dy) < 40) {
                setIsMobileFiltersOpen(false);
              }
            }
          }}
        >
          <div className="p-4 mt-2 bg-white rounded-lg shadow-lg ring-1 ring-blue-100 border-l-4 border-blue-600 z-50 relative dark:bg-slate-800 dark:ring-slate-700 dark:border-blue-500">
            {/* Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              {effectiveFilterConfig.map((config: any) => (
                <div key={config.id} className="mr-4">
                  <h3 className="mb-2 text-base font-semibold text-gray-700 dark:text-slate-200">{config.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {config.options.map((option: any) => {
                      if (availableOptions[config.id]?.[option.value] > 0) {
                        return (
                          <FilterButton
                            key={option.value}
                            label={option.label}
                            color={option.color}
                            variant={config.id === 'phase' ? 'outline' : 'solid'}
                            isActive={activeFilters[config.id]?.includes(option.value)}
                            onClick={() => handleToggleFilter(config.id, option.value)}
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
              <button onClick={scrollToTargetWeek} disabled={!targetWeekInfo.week} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg sm:w-auto hover:bg-green-700 disabled:bg-gray-400">
                <LocateFixed size={16}/> Ga naar {targetWeekInfo.label || 'week'}
              </button>
              <button onClick={handleResetFilters} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg sm:w-auto hover:bg-gray-300"> <RotateCcw size={16}/> Reset Filters</button>
              <button 
                onClick={toggleAllLopendeZaken} 
                className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg sm:w-auto hover:bg-gray-300"
              >
                <ChevronUp size={16} className={`transition-transform ${areAllLopendeZakenCollapsed ? 'rotate-180' : ''}`}/>
                <span>{areAllLopendeZakenCollapsed ? 'Toon alle doorlopende activiteiten' : 'Verberg alle doorlopende activiteiten'}</span>
              </button>
              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className={`flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium rounded-lg sm:w-auto transition-colors ${isDark ? 'text-slate-200 bg-slate-700 hover:bg-slate-600' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'}`}
                title="Schakel licht/donker"
              >
                {isDark ? <Sun size={16}/> : <Moon size={16}/>}
                <span>{isDark ? 'Lichte modus' : 'Donkere modus'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay (outside header) to close filters via tap or swipe-right on mobile */}
      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/10"
          onClick={() => setIsMobileFiltersOpen(false)}
          onTouchStart={(e) => {
            (Home as any).touchStartX = e.touches[0].clientX;
            (Home as any).touchStartY = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const sx = (Home as any).touchStartX as number | undefined;
            const sy = (Home as any).touchStartY as number | undefined;
            if (typeof sx === 'number' && typeof sy === 'number') {
              const dx = e.changedTouches[0].clientX - sx;
              const dy = e.changedTouches[0].clientY - sy;
              if ((dx > 60 || dx < -60) && Math.abs(dy) < 40) {
                setIsMobileFiltersOpen(false);
              }
            }
          }}
        />
      )}

       {/* Main Content Grid */}
       <div className="mt-8"> {/* Added margin-top to the content grid */}
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
            {weeks.map((week: WeekInfo) => {
              const weekKey = `${week.semester}-${week.weekCode}`;
              const isTargetWeek = targetWeekInfo.week?.id === week.id;
              return (
                <div key={weekKey} ref={el => weekRefs.current.set(weekKey, el)}>
                  <WeekSection
                    week={week}
                    items={itemsByWeek.get(weekKey) || []}
                    onDocumentClick={() => {}} // Placeholder for now
                    highlightLabel={isTargetWeek ? targetWeekInfo.label : null}
                    isLopendeZakenCollapsed={collapsedSections[weekKey] || false}
                    onToggleLopendeZaken={() => toggleSectionCollapse(weekKey)}
                  />
                </div>
              )
            })}
          </div>
        )}
       </div>
    </div>
    
    {/* Snelkoppelingen Modal */}
    <SnelkoppelingenModal 
      isOpen={isSnelkoppelingenOpen} 
      onClose={() => setIsSnelkoppelingenOpen(false)}
      snelkoppelingen={snelkoppelingen}
      groepen={groepen}
    />
  </div>
);

function App() {
  const { weeks, planningItems, loading, error } = useData();
  const { activeFilters, toggleFilter, resetFilters } = useFilters();
  const { snelkoppelingen, groepen } = useSnelkoppelingen();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSnelkoppelingenOpen, setIsSnelkoppelingenOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [areAllLopendeZakenCollapsed, setAreAllLopendeZakenCollapsed] = useState(() => {
    const saved = localStorage.getItem('areAllLopendeZakenCollapsed');
    return saved !== null ? saved === 'true' : true;
  });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [hasSeenHelp, setHasSeenHelp] = useState(() => {
    return localStorage.getItem('hasSeenHelp') === 'true';
  });
  const [bannerVisibility, setBannerVisibility] = useState({
    development: true,
    changes: true,
  });
  const [isQrOpen, setIsQrOpen] = useState(false);

  const weekRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const headerRef = useRef<HTMLElement | null>(null);
  const bannersRef = useRef<HTMLDivElement | null>(null);
  const keepInViewWeekKey = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!hasSeenHelp && !loading) {
      setIsHelpModalOpen(true);
      setHasSeenHelp(true);
      localStorage.setItem('hasSeenHelp', 'true');
    }
  }, [hasSeenHelp, loading]);

  useLayoutEffect(() => {
    // Apply initial theme class
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useLayoutEffect(() => {
    if (weeks.length > 0) {
      const newCollapsedSections: Record<string, boolean> = {};
      weeks.forEach(week => {
        const weekKey = `${week.semester}-${week.weekCode}`;
        newCollapsedSections[weekKey] = areAllLopendeZakenCollapsed;
      });
      setCollapsedSections(newCollapsedSections);
    }
  }, [weeks, areAllLopendeZakenCollapsed]);

  const saveCurrentScrollPosition = () => {
    if (headerRef.current && bannersRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      const bannersHeight = bannersRef.current.offsetHeight;
      const totalOffset = headerHeight + bannersHeight;
      
      const weekElements = Array.from(weekRefs.current.entries())
        .map(([key, element]) => ({ key, element }))
        .filter(({ element }) => element !== null);
      
      let topWeek: TopWeekInfo | null = null;
      
      for (const { key, element } of weekElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= totalOffset) {
            if (!topWeek || rect.top < topWeek.position) {
              topWeek = { key, position: rect.top };
            }
          }
        }
      }

      if (topWeek) {
        keepInViewWeekKey.current = topWeek.key;
      }
    }
  };

  const handleToggleFilter = (configId: string, optionValue: string) => {
    saveCurrentScrollPosition();
    toggleFilter(configId, optionValue);
  };

  const handleResetFilters = () => {
    saveCurrentScrollPosition();
    resetFilters();
  };

  const toggleSectionCollapse = (weekKey: string) => {
    saveCurrentScrollPosition();
    setCollapsedSections(prev => ({
      ...prev,
      [weekKey]: !(prev[weekKey] || false)
    }));
  };

  const toggleAllLopendeZaken = () => {
    saveCurrentScrollPosition();
    const nextState = !areAllLopendeZakenCollapsed;
    setAreAllLopendeZakenCollapsed(nextState);
    
    localStorage.setItem('areAllLopendeZakenCollapsed', nextState.toString());
    
    const newCollapsedSections: Record<string, boolean> = {};
    weeks.forEach(week => {
      const weekKey = `${week.semester}-${week.weekCode}`;
      newCollapsedSections[weekKey] = nextState;
    });
    setCollapsedSections(newCollapsedSections);
  };

  // Dynamische filterconfig: vul 'Rol' opties op basis van aanwezige data
  const effectiveFilterConfig = useMemo(() => {
    const cloned = filterConfig.map(cfg => ({ ...cfg, options: [...cfg.options] }));
    const roleIdx = cloned.findIndex(c => c.id === 'role');
    if (roleIdx !== -1) {
      const roles = new Set<string>();
      planningItems.forEach(item => {
        const role = (item.role || '').toString().trim().toLowerCase();
        if (role) roles.add(role);
      });
      const palette = ['blue','indigo','teal','yellow','pink','purple','green','orange','slate','gray'];
      const options = Array.from(roles).sort().map((r, i) => ({
        value: r,
        label: r.charAt(0).toUpperCase() + r.slice(1),
        color: palette[i % palette.length],
      }));
      cloned[roleIdx] = { ...cloned[roleIdx], options };
    }
    return cloned;
  }, [planningItems]);

  const availableOptions = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    effectiveFilterConfig.forEach(config => {
      counts[config.id] = {};
      config.options.forEach(option => {
        counts[config.id][option.value] = 0;
      });
    });

    planningItems.forEach(item => {
      effectiveFilterConfig.forEach(config => {
        const itemValue: any = (item as any)[config.dataKey];
        if (config.dataKey === 'semester' && itemValue) {
          // nog geen semester-filter UI actief
        } else if (config.dataKey === 'role') {
          const role = (item.role || '').toString().toLowerCase();
          if (role && counts[config.id] && counts[config.id][role] !== undefined) {
            counts[config.id][role]++;
          }
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
  }, [planningItems, effectiveFilterConfig]);

  const targetWeekInfo = useMemo(() => {
    const now = new Date();
    
    const currentWeek = weeks.find(week => {
      const startDate = parseDate(week.startDate);
      if (!startDate) return false;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      return now >= startDate && now <= endDate;
    });

    if (currentWeek) {
      return { week: currentWeek, label: 'Huidige week' };
    }

    let closestFutureWeek: WeekInfo | null = null;
    let smallestDiff = Infinity;

    weeks.forEach(week => {
      const weekStartDate = parseDate(week.startDate);
      if (weekStartDate && weekStartDate >= now) {
        const diff = weekStartDate.getTime() - now.getTime();
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestFutureWeek = week;
        }
      }
    });
    
    if (closestFutureWeek) {
      return { week: closestFutureWeek, label: 'Eerstvolgende' };
    }

    return { week: null, label: null };
  }, [weeks]);


  useLayoutEffect(() => {
    if (keepInViewWeekKey.current && headerRef.current && bannersRef.current) {
      const weekKey = keepInViewWeekKey.current;
      const element = weekRefs.current.get(weekKey);
      
      if (element) {
        const headerHeight = headerRef.current.offsetHeight;
        const bannersHeight = bannersRef.current.offsetHeight;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerHeight - bannersHeight - 20;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'auto'
        });
      }
      keepInViewWeekKey.current = null;
    }
  }, [activeFilters, areAllLopendeZakenCollapsed]);


  const scrollToTargetWeek = () => {
    if (targetWeekInfo.week) {
      const weekKey = `${targetWeekInfo.week.semester}-${targetWeekInfo.week.weekCode}`;
      const element = weekRefs.current.get(weekKey);
      
      if (element && headerRef.current && bannersRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const bannersHeight = bannersRef.current.offsetHeight;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerHeight - bannersHeight - 40;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Automatisch scrollen naar huidige week bij laden van de app
  useLayoutEffect(() => {
    if (!loading && weeks.length > 0 && targetWeekInfo.week) {
      // Wacht even tot de DOM volledig geladen is
      const timer = setTimeout(() => {
        const weekKey = `${targetWeekInfo.week!.semester}-${targetWeekInfo.week!.weekCode}`;
        const element = weekRefs.current.get(weekKey);
        
        if (element && headerRef.current && bannersRef.current) {
          const headerHeight = headerRef.current.offsetHeight;
          const bannersHeight = bannersRef.current.offsetHeight;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - headerHeight - bannersHeight - 20;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'auto'
          });
        }
      }, 300); // Wacht tot de DOM volledig geladen is

      return () => clearTimeout(timer);
    }
  }, [loading, weeks, targetWeekInfo.week]);

  const filteredItems = planningItems.filter(item => {
    return effectiveFilterConfig.every(config => {
      const selectedOptions = activeFilters[config.id];
      if (!selectedOptions || selectedOptions.length === 0) {
        return true;
      }
      
      if (config.dataKey === 'semester') {
        return selectedOptions.includes(String(item.semester));
      } else if (config.dataKey === 'role') {
        const role = (item.role || '').toString().toLowerCase();
        return selectedOptions.includes(role);
      } else {
        const subObject = (item as any)[config.dataKey];
        if (isSubjects(subObject)) {
          return selectedOptions.some(option => (subObject as any)[option]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Er is een fout opgetreden</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Probeer opnieuw
            </button>
            <button 
              onClick={() => window.location.href = '/admin'} 
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Ga naar Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCloseDevBanner = () => setBannerVisibility(prev => ({ ...prev, development: false }));
  const handleCloseChangesBanner = () => setBannerVisibility(prev => ({ ...prev, changes: false }));

  // Download functie voor activiteiten
  const handleDownloadActivities = () => {
    // Converteer de gefilterde items naar Excel formaat
    const excelData = filteredItems.map(item => {
      // Converteer subjects object naar string
      const subjects = Object.entries(item.subjects || {})
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
        .join(', ');

      // Converteer phases object naar string
      const phases = Object.entries(item.phases || {})
        .filter(([_, value]) => value)
        .map(([key, _]) => key === 'h2h3' ? 'H2/3' : key.toUpperCase())
        .join(', ');

      // Converteer links array naar string
      const links = item.links ? JSON.stringify(item.links) : '';

      return {
        ID: item.id || '',
        Status: 'ongewijzigd',
        Titel: item.title || '',
        Beschrijving: item.description || '',
        'Start Datum': item.startDate || '',
        'Eind Datum': item.endDate || '',
        'Start Tijd': item.startTime || '',
        'Eind Tijd': item.endTime || '',
        Rol: item.role || '',
        Fase: phases,
        Onderwerp: subjects,
        'Instructies URL': item.instructions || '',
        Links: links,
        'Actie Vereist': item.deadline ? 'true' : 'false',
        Deadline: item.deadline || '',
        Opmerkingen: ''
      };
    });

    // Genereer bestandsnaam met huidige datum
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `activiteiten-${dateStr}`;

    // Export naar Excel
    exportToExcel(excelData, fileName, 'Activiteiten');
  };

  return (
    <ErrorBoundary>
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              bannerVisibility={bannerVisibility}
              handleCloseDevBanner={handleCloseDevBanner}
              handleCloseChangesBanner={handleCloseChangesBanner}
              headerRef={headerRef}
              bannersRef={bannersRef}
              isMobileFiltersOpen={isMobileFiltersOpen}
              setIsMobileFiltersOpen={setIsMobileFiltersOpen}
              setIsQrOpen={setIsQrOpen}
              isDark={isDark}
              toggleDark={toggleDark}
              effectiveFilterConfig={effectiveFilterConfig}
              availableOptions={availableOptions}
              activeFilters={activeFilters}
              handleToggleFilter={handleToggleFilter}
              scrollToTargetWeek={scrollToTargetWeek}
              targetWeekInfo={targetWeekInfo}
              handleResetFilters={handleResetFilters}
              toggleAllLopendeZaken={toggleAllLopendeZaken}
              areAllLopendeZakenCollapsed={areAllLopendeZakenCollapsed}
              setIsHelpModalOpen={setIsHelpModalOpen}
              loading={loading}
              weeks={weeks}
              itemsByWeek={itemsByWeek}
              weekRefs={weekRefs}
              toggleSectionCollapse={toggleSectionCollapse}
              collapsedSections={collapsedSections}
              snelkoppelingen={snelkoppelingen}
              groepen={groepen}
              isSnelkoppelingenOpen={isSnelkoppelingenOpen}
              setIsSnelkoppelingenOpen={setIsSnelkoppelingenOpen}
              handleDownloadActivities={handleDownloadActivities}
            />
          } 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      <QRModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </ErrorBoundary>
  );
}

export default App;