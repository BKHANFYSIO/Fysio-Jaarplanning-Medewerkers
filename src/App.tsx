import { Routes, Route } from 'react-router-dom';
import { WeekSection } from './components/WeekSection';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useData } from './hooks/useData';
import { useFilters } from './hooks/useFilters';
import { useAvailableFilterOptions } from './hooks/useAvailableFilterOptions';
import { FilterButton } from './components/FilterButton';
import { filterConfig } from './config/filters';
import { PlanningItem, WeekInfo } from './types';
import { useRef, useMemo, useState, useLayoutEffect, useEffect } from 'react';
import { parseDate } from './utils/dateUtils';
import { exportToExcel } from './utils/excelParser';
import { Filter, RotateCcw, LocateFixed, ChevronDown, ChevronUp, HelpCircle, QrCode, Sun, Moon, Link, Download } from 'lucide-react';
import { extractNormalizedRoles, formatRoleLabel, formatIdToLabel } from './utils/roleUtils';
import { HelpModal } from './components/HelpModal';
import { DevelopmentBanner } from './components/DevelopmentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChangesBanner } from './components/ChangesBanner';
import { QRModal } from './components/QRModal';
import { DownloadModal } from './components/DownloadModal';
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
  setIsDownloadModalOpen,
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
  filteredItemsCount,
  totalItemsCount,
  availableFilterOptions,
}: any) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelMaxHeight, setPanelMaxHeight] = useState<number | null>(null);

  // Lock body scroll when mobile filters are open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileFiltersOpen]);

  // Compute max height for the filter panel so it can scroll independently
  useEffect(() => {
    const computeMaxHeight = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const marginBottom = 16; // space below panel
      const max = Math.max(200, window.innerHeight - rect.top - marginBottom);
      setPanelMaxHeight(max);
    };

    if (isMobileFiltersOpen) {
      // Wait a tick to ensure layout is ready
      const timer = setTimeout(() => computeMaxHeight(), 0);
      window.addEventListener('resize', computeMaxHeight);
      window.addEventListener('orientationchange', computeMaxHeight as any);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', computeMaxHeight);
        window.removeEventListener('orientationchange', computeMaxHeight as any);
      };
    } else {
      setPanelMaxHeight(null);
    }
  }, [isMobileFiltersOpen]);

  return (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
    <div ref={bannersRef} className="sticky top-0 z-50">
      {bannerVisibility.development && <DevelopmentBanner onClose={handleCloseDevBanner} />}
      {bannerVisibility.changes && <ChangesBanner onClose={handleCloseChangesBanner} />}
    </div>
    <div className="container p-4 mx-auto">
      <header ref={headerRef} className="sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-900/90 backdrop-blur-sm">
        {/* Desktop Layout (lg and up) */}
        <div className="hidden lg:flex items-center justify-between py-3">
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
              onClick={() => setIsDownloadModalOpen(true)}
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
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Toon QR"
            >
              <QrCode size={16}/>
              <span>QR</span>
            </button>
            {/* Filter Count Display */}
            <div className="flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
              <Filter size={14} className="text-blue-600 dark:text-blue-400"/>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                {filteredItemsCount}/{totalItemsCount}
              </span>
            </div>
            {/* Mobile toggle removed from desktop header to avoid mid layout */}
          </div>
        </div>

        {/* Mobile Layout (< lg) */}
        <div className="lg:hidden py-3">
          <div className="flex items-center justify-between mb-3">
            <img src="/images/Logo-HAN.webp" alt="HAN Logo" className="h-8"/>
            <h1 className="text-lg font-bold text-gray-800 dark:text-slate-100 text-center flex-1 mx-2">
              Jaarplanning Fysiotherapie
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-sm text-red-600 animate-heartbeat">(Medewerkers)</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            {/* Snelkoppelingen Button */}
            <button 
              onClick={() => setIsSnelkoppelingenOpen(true)}
              className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Snelkoppelingen"
            >
              <Link size={18}/>
            </button>
            {/* Download Button */}
            <button 
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Download activiteiten als Excel"
            >
              <Download size={18}/>
            </button>
            {/* Help Button */}
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              title="Uitleg"
            >
              <HelpCircle size={18}/>
            </button>
            {/* Filter Button with count */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="flex items-center justify-center w-10 h-10 text-white bg-gray-700 rounded-full hover:bg-gray-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
                title="Filters & Opties"
              >
                <Filter size={18}/>
              </button>
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-full">
                <Filter size={14} className="text-blue-600 dark:text-blue-400"/>
                <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{filteredItemsCount}/{totalItemsCount}</span>
              </div>
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
          <div
            ref={panelRef}
            className="p-4 mt-2 bg-white rounded-lg shadow-lg ring-1 ring-blue-100 border-l-4 border-blue-600 z-50 relative dark:bg-slate-800 dark:ring-slate-700 dark:border-blue-500 overscroll-contain overflow-x-hidden"
            style={isMobileFiltersOpen ? { maxHeight: panelMaxHeight ? panelMaxHeight + 'px' : undefined, overflowY: 'auto' } : undefined}
          >
            {/* Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              {effectiveFilterConfig.map((config: any) => (
                <div key={config.id} className="mr-4">
                  <h3 className="mb-2 text-base font-semibold text-gray-700 dark:text-slate-200">{config.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {config.options
                      .filter((option: any) => !option.isOther)
                      .map((option: any) => {
                        const isDisabled = !availableFilterOptions[config.id]?.[option.value];
                        return (
                          <FilterButton
                            key={option.value}
                            label={option.label}
                            color={option.color}
                            variant={config.id === 'phase' ? 'outline' : 'solid'}
                            isActive={activeFilters[config.id]?.includes(option.value)}
                            onClick={() => handleToggleFilter(config.id, option.value)}
                            disabled={isDisabled}
                            disabledReason={isDisabled ? "Geen activiteiten beschikbaar voor deze combinatie" : undefined}
                          />
                        );
                      })}
                    {config.options.some((o: any) => o.isOther) && (
                      <>
                        <div className="w-px h-6 bg-gray-300 mx-2 self-center"></div>
                        {config.options
                          .filter((option: any) => option.isOther)
                          .map((option: any) => {
                            const isDisabled = !availableFilterOptions[config.id]?.[option.value];
                            return (
                              <FilterButton
                                key={option.value}
                                label={option.label}
                                color={option.color}
                                variant={config.id === 'phase' ? 'outline' : 'solid'}
                                isActive={activeFilters[config.id]?.includes(option.value)}
                                onClick={() => handleToggleFilter(config.id, option.value)}
                                disabled={isDisabled}
                                disabledReason={isDisabled ? "Geen activiteiten beschikbaar voor deze combinatie" : undefined}
                                className="border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                              />
                            );
                          })}
                      </>
                    )}
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
              <button onClick={handleResetFilters} className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg sm:w-auto hover:bg-gray-300"> 
                <RotateCcw size={16}/> Reset Filters
              </button>
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
}

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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const weekRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const headerRef = useRef<HTMLElement | null>(null);
  const bannersRef = useRef<HTMLDivElement | null>(null);
  const keepInViewWeekKey = useRef<string | null>(null);
  const lastHeaderTotalHeightRef = useRef<number | null>(null);
  const lastMobileOpenRef = useRef<boolean | null>(null);

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

  // Houd content uitgelijnd met de header wanneer mobiel filterpaneel opent/sluit
  useLayoutEffect(() => {
    const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 0;
    const bannersHeight = bannersRef.current ? bannersRef.current.offsetHeight : 0;
    const total = headerHeight + bannersHeight;

    if (lastHeaderTotalHeightRef.current !== null && lastMobileOpenRef.current !== null && lastMobileOpenRef.current !== isMobileFiltersOpen) {
      const delta = total - lastHeaderTotalHeightRef.current;
      if (delta !== 0) {
        window.scrollBy({ top: delta, behavior: 'auto' });
      }
    }

    lastHeaderTotalHeightRef.current = total;
    lastMobileOpenRef.current = isMobileFiltersOpen;
  }, [isMobileFiltersOpen]);

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
      const roleIds = new Set<string>();
      planningItems.forEach(item => {
        const ids = extractNormalizedRoles(item.role);
        ids.forEach(id => roleIds.add(id));
      });
      const palette = ['blue','indigo','teal','yellow','pink','purple','green','orange','slate','gray'];
      const options = Array.from(roleIds).sort().map((id, i) => ({
        value: id,
        label: formatRoleLabel(id),
        color: palette[i % palette.length],
      }));
      cloned[roleIdx] = { ...cloned[roleIdx], options };
    }
    const subjectIdx = cloned.findIndex(c => c.id === 'subject');
    if (subjectIdx !== -1) {
      const keys = new Set<string>();
      planningItems.forEach(item => {
        const subj: any = (item as any).subjects || {};
        Object.keys(subj).forEach(k => {
          if (subj[k] === true) keys.add(k);
        });
      });
      const palette = ['orange','pink','indigo','blue','green','yellow','gray','teal','slate','purple'];
      const subjectLabelMap: Record<string, string> = {
        meeloops: 'Meeloopstage',
        inschrijven: 'Inschrijvingen/aanmeldingen',
      };
      const options = Array.from(keys).sort().map((id, i) => ({
        value: id,
        label: subjectLabelMap[id] ?? (['ipl','bvp','pzw'].includes(id) ? id.toUpperCase() : formatIdToLabel(id)),
        color: palette[i % palette.length],
        isOther: ['overig','other','overige','anders'].includes(id.toLowerCase()),
      }));
      cloned[subjectIdx] = { ...cloned[subjectIdx], options };
    }
    const processIdx = cloned.findIndex(c => c.id === 'process');
    if (processIdx !== -1) {
      const keys = new Set<string>();
      planningItems.forEach(item => {
        const proc = (item as any).processes || {};
        Object.keys(proc).forEach(k => keys.add(k));
      });
      const palette = ['teal','yellow','pink','purple','green','orange','slate','gray','indigo','blue'];
      const options = Array.from(keys).sort().map((id, i) => ({
        value: id,
        label: formatIdToLabel(id),
        color: palette[i % palette.length],
      }));
      cloned[processIdx] = { ...cloned[processIdx], options };
    }
    return cloned;
  }, [planningItems]);

  const availableFilterOptions = useAvailableFilterOptions(planningItems, activeFilters, effectiveFilterConfig);

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
          const ids = extractNormalizedRoles(item.role);
          ids.forEach(id => {
            if (counts[config.id] && counts[config.id][id] !== undefined) {
              counts[config.id][id]++;
            }
          });
        } else if (config.dataKey === 'phases') {
          const phases: any = itemValue || {};
          const hasAnyPhase = !!(phases.p || phases.h1 || phases.h2h3);
          if (!hasAnyPhase && counts[config.id]?.['algemeen'] !== undefined) {
            counts[config.id]['algemeen']++;
          }
          ['p','h1','h2h3'].forEach(k => {
            if (phases[k] === true && counts[config.id]?.[k] !== undefined) {
              counts[config.id][k]++;
            }
          });
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
        const roles = extractNormalizedRoles((item.role || '').toString());
        return selectedOptions.some(selectedRole => roles.includes(selectedRole));
      } else if (config.dataKey === 'phases') {
        const phases = (item as any).phases || {};
        const hasAnyPhase = !!(phases.p || phases.h1 || phases.h2h3);
        return selectedOptions.every(option => {
          if (option === 'algemeen') {
            // match wanneer geen enkele fase aan staat
            return !hasAnyPhase;
          }
          return !!phases[option];
        });
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

  // Unieke activiteiten tellen: gebruik alleen items die isFirstInSeries zijn
  const totalUniqueCount = useMemo(() => {
    return planningItems.reduce((count, item) => count + (item.isFirstInSeries ? 1 : 0), 0);
  }, [planningItems]);

  const filteredUniqueCount = useMemo(() => {
    return filteredItems.reduce((count, item) => count + (item.isFirstInSeries ? 1 : 0), 0);
  }, [filteredItems]);

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
    // Verzamel alle process-keys die zichtbaar zijn in filters
    const processKeys = new Set<string>();
    filteredItems.forEach(item => {
      const proc = (item as any).processes || {};
      Object.keys(proc).forEach(k => processKeys.add(k));
    });

    const excelData = filteredItems.map(item => {

      const base: any = {
        'Wat?': item.title || '',
        'Extra regel': item.description || '',
        'Instructies': item.instructions || '',
        'Links': item.links ? item.links.join(', ') : '',
        'Waardere': item.subjects.waarderen ? 'v' : '',
        'Getuigsch': item.subjects.getuigschriften ? 'v' : '',
        'Inschrijve': item.subjects.inschrijven ? 'v' : '',
        'Overig': item.subjects.overig ? 'v' : '',
        'Meeloops': item.subjects.meeloops ? 'v' : '',
        'Juniorsta': item.subjects.juniorstage ? 'v' : '',
        'IPL': item.subjects.ipl ? 'v' : '',
        'BVP': item.subjects.bvp ? 'v' : '',
        'PZW': item.subjects.pzw ? 'v' : '',
        'Minor': item.subjects.minor ? 'v' : '',
        'Startdatu': item.startDate || '',
        'Einddatur': item.endDate || '',
        'Tijd starto': item.startTime || '',
        'Tijd eindd': item.endTime || '',
        'Deadline': item.deadline || '',
        'P': item.phases.p ? 'v' : '',
        'H1': item.phases.h1 ? 'v' : '',
        'H2/3': item.phases.h2h3 ? 'v' : '',
        'Rol': item.role || '',
      };
      // Voeg processen toe als losse kolommen met nette labels
      const proc = (item as any).processes || {};
      Array.from(processKeys).forEach(id => {
        const label = formatIdToLabel(id);
        base[label] = proc[id] ? 'v' : '';
      });
      return base;
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
              setIsDownloadModalOpen={setIsDownloadModalOpen}
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
              filteredItemsCount={filteredUniqueCount}
              totalItemsCount={totalUniqueCount}
              availableFilterOptions={availableFilterOptions}
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
      <DownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownloadActivities}
        filteredItemsCount={filteredItems.length}
      />
    </ErrorBoundary>
  );
}

export default App;