import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, RotateCcw, Menu, X, MapPin } from 'lucide-react';
import { FilterButton } from './components/FilterButton';
import { WeekSection } from './components/WeekSection';
import { DocumentModal } from './components/DocumentModal';
import { useData } from './hooks/useData';
import { useFilters } from './hooks/useFilters';
import { parseDate, getWeeksForDateRange } from './utils/dateUtils';

function App() {
  const { planningItems, weeks, loading, error } = useData();
  const { filteredItems, subjectFilter, phaseFilter, setSubjectFilter, setPhaseFilter, resetFilters } = useFilters(planningItems);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    documentName: string;
    activityTitle: string;
  }>({
    isOpen: false,
    documentName: '',
    activityTitle: ''
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolledToCurrentWeek, setHasScrolledToCurrentWeek] = useState(false);
  const [preserveScrollWeek, setPreserveScrollWeek] = useState<string | null>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);
  const weekRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const headerRef = useRef<HTMLDivElement>(null);

  const handleDocumentClick = (documentName: string, activityTitle: string) => {
    setModalState({
      isOpen: true,
      documentName,
      activityTitle
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      documentName: '',
      activityTitle: ''
    });
  };

  // Function to get header height dynamically
  const getHeaderHeight = (): number => {
    if (headerRef.current) {
      return headerRef.current.offsetHeight;
    }
    return window.innerWidth >= 1024 ? 180 : 140;
  };

  // Function to find current week (exact match only)
  const getCurrentWeek = () => {
    const today = new Date();
    console.log('Finding current week for date:', today.toDateString());
    
    const exactMatch = weeks.find(week => {
      if (week.isVacation) return false;
      
      const weekStart = parseDate(week.startDate);
      if (!weekStart) return false;
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const isInWeek = today >= weekStart && today <= weekEnd;
      console.log(`Week ${week.weekLabel}: ${weekStart.toDateString()} to ${weekEnd.toDateString()}, contains today: ${isInWeek}`);
      
      return isInWeek;
    });

    if (exactMatch) {
      console.log('Found exact current week match:', exactMatch.weekLabel);
    } else {
      console.log('No exact current week match found');
    }

    return exactMatch || null;
  };

  // Function to find the best week to scroll to (current week or closest)
  const getScrollTargetWeek = () => {
    const today = new Date();
    
    const exactMatch = weeks.find(week => {
      if (week.isVacation) return false;
      
      const weekStart = parseDate(week.startDate);
      if (!weekStart) return false;
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      return today >= weekStart && today <= weekEnd;
    });

    if (exactMatch) {
      return exactMatch;
    }

    console.log('No exact match found, looking for closest week...');
    
    let closestWeek = null;
    let smallestDifference = Infinity;

    weeks.forEach(week => {
      if (week.isVacation) return;
      
      const weekStart = parseDate(week.startDate);
      if (!weekStart) return;

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      let distance;
      if (today < weekStart) {
        distance = weekStart.getTime() - today.getTime();
      } else if (today > weekEnd) {
        distance = today.getTime() - weekEnd.getTime();
      } else {
        distance = 0;
      }

      console.log(`Week ${week.weekLabel}: distance = ${Math.round(distance / (1000 * 60 * 60 * 24))} days`);

      if (distance < smallestDifference) {
        smallestDifference = distance;
        closestWeek = week;
      }
    });

    console.log('Closest week found:', closestWeek?.weekLabel);
    return closestWeek;
  };

  // Function to get the first visible week under the header
  const getTopVisibleWeek = (): string | null => {
    const scrollTop = window.scrollY;
    const headerHeight = getHeaderHeight();
    const targetY = scrollTop + headerHeight + 20;
    
    console.log('getTopVisibleWeek:', {
      scrollTop,
      headerHeight,
      targetY,
      totalWeeks: weekRefs.current.size
    });

    let topVisibleWeek: string | null = null;
    let closestDistance = Infinity;

    weekRefs.current.forEach((element, weekKey) => {
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementBottom = elementTop + rect.height;
        
        console.log(`Week ${weekKey}:`, {
          elementTop,
          elementBottom,
          targetY,
          isVisible: elementTop <= targetY && elementBottom > targetY
        });
        
        if (elementTop <= targetY && elementBottom > targetY) {
          const distance = Math.abs(elementTop - targetY);
          if (distance < closestDistance) {
            closestDistance = distance;
            topVisibleWeek = weekKey;
          }
        }
      }
    });

    console.log('Top visible week found:', topVisibleWeek);
    return topVisibleWeek;
  };

  // Function to scroll to a specific week with proper header offset
  const scrollToWeek = (weekKey: string) => {
    const element = weekRefs.current.get(weekKey);
    if (element) {
      console.log('Scrolling to week:', weekKey);
      const headerHeight = getHeaderHeight();
      const elementTop = element.offsetTop;
      const scrollPosition = elementTop - headerHeight - 10;
      
      console.log('Scroll calculation:', {
        elementTop,
        headerHeight,
        scrollPosition
      });
      
      window.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  };

  // Function to scroll to current week (or closest week)
  const scrollToCurrentWeek = () => {
    const targetWeek = getScrollTargetWeek();
    if (targetWeek) {
      const weekKey = `${targetWeek.semester}-${targetWeek.weekCode}`;
      scrollToWeek(weekKey);
      setHasScrolledToCurrentWeek(true);
      setPreserveScrollWeek(null);
      console.log('Scrolled to target week:', weekKey);
    }
  };

  // Handle filter changes with scroll preservation
  const handlePhaseFilterChange = (newFilter: typeof phaseFilter) => {
    if (hasScrolledToCurrentWeek) {
      const topWeek = getTopVisibleWeek();
      if (topWeek) {
        setPreserveScrollWeek(topWeek);
        console.log('Captured top visible week for preservation:', topWeek);
      }
    }
    setPhaseFilter(newFilter);
  };

  const handleSubjectFilterChange = (newFilter: typeof subjectFilter) => {
    if (hasScrolledToCurrentWeek) {
      const topWeek = getTopVisibleWeek();
      if (topWeek) {
        setPreserveScrollWeek(topWeek);
        console.log('Captured top visible week for preservation:', topWeek);
      }
    }
    setSubjectFilter(newFilter);
  };

  const handleResetFilters = () => {
    if (hasScrolledToCurrentWeek) {
      const topWeek = getTopVisibleWeek();
      if (topWeek) {
        setPreserveScrollWeek(topWeek);
        console.log('Captured top visible week for preservation:', topWeek);
      }
    }
    resetFilters();
    setIsMobileMenuOpen(false);
  };

  // Scroll to current week on initial load only
  useEffect(() => {
    if (weeks.length > 0 && !loading && !hasScrolledToCurrentWeek) {
      const timer = setTimeout(() => {
        scrollToCurrentWeek();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [weeks, loading, hasScrolledToCurrentWeek]);

  // Preserve scroll position after filter changes
  useEffect(() => {
    if (preserveScrollWeek && hasScrolledToCurrentWeek) {
      const timer = setTimeout(() => {
        console.log('Restoring scroll to preserved week:', preserveScrollWeek);
        scrollToWeek(preserveScrollWeek);
        setPreserveScrollWeek(null);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [filteredItems, preserveScrollWeek, hasScrolledToCurrentWeek]);

  // Close mobile menu when clicking outside or on overlay
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Fout bij laden</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Group items by week
  const itemsByWeek = new Map<string, typeof filteredItems>();
  
  filteredItems.forEach((item) => {
    const startDate = parseDate(item.startDate);
    const endDate = parseDate(item.endDate);
    
    if (startDate && endDate) {
      const relevantWeeks = getWeeksForDateRange(startDate, endDate, weeks);
      
      relevantWeeks.forEach(week => {
        const weekKey = `${week.semester}-${week.weekCode}`;
        if (!itemsByWeek.has(weekKey)) {
          itemsByWeek.set(weekKey, []);
        }
        itemsByWeek.get(weekKey)!.push(item);
      });
    }
  });

  const currentWeek = getCurrentWeek();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header - Minimalist Tab Design */}
      <div ref={headerRef} className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Jaarplanning Fysiotherapie</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Studiejaar 2025-2026</p>
                </div>
              </div>
              
              {/* Desktop Action Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={scrollToCurrentWeek}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  <MapPin className="w-4 h-4" />
                  Huidige week
                </button>
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Menu className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
          </div>

          {/* Desktop Filter Tabs */}
          <div className="hidden lg:block px-6 py-4">
            <div className="flex items-center justify-center space-x-8">
              {/* Phase Filter Tab */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Studiefase:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <FilterButton
                    label="Alles"
                    isActive={phaseFilter === 'all'}
                    onClick={() => handlePhaseFilterChange('all')}
                    color="blue"
                  />
                  <FilterButton
                    label="P"
                    isActive={phaseFilter === 'p'}
                    onClick={() => handlePhaseFilterChange('p')}
                    color="green"
                  />
                  <FilterButton
                    label="H1"
                    isActive={phaseFilter === 'h1'}
                    onClick={() => handlePhaseFilterChange('h1')}
                    color="orange"
                  />
                  <FilterButton
                    label="H2/3"
                    isActive={phaseFilter === 'h2h3'}
                    onClick={() => handlePhaseFilterChange('h2h3')}
                    color="purple"
                  />
                </div>
              </div>

              {/* Subject Filter Tab */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Onderwerp:</span>
                <div className="flex bg-gray-100 rounded-lg p-1 flex-wrap">
                  <FilterButton
                    label="Alles"
                    isActive={subjectFilter === 'all'}
                    onClick={() => handleSubjectFilterChange('all')}
                    color="blue"
                  />
                  <FilterButton
                    label="BVP"
                    isActive={subjectFilter === 'bvp'}
                    onClick={() => handleSubjectFilterChange('bvp')}
                    color="orange"
                  />
                  <FilterButton
                    label="PZW"
                    isActive={subjectFilter === 'pzw'}
                    onClick={() => handleSubjectFilterChange('pzw')}
                    color="pink"
                  />
                  <FilterButton
                    label="Minor"
                    isActive={subjectFilter === 'minor'}
                    onClick={() => handleSubjectFilterChange('minor')}
                    color="indigo"
                  />
                  <FilterButton
                    label="IPL"
                    isActive={subjectFilter === 'ipl'}
                    onClick={() => handleSubjectFilterChange('ipl')}
                    color="blue"
                  />
                  <FilterButton
                    label="Juniorstage"
                    isActive={subjectFilter === 'juniorstage'}
                    onClick={() => handleSubjectFilterChange('juniorstage')}
                    color="green"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Filter op studiefase:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FilterButton
                      label="Alles"
                      isActive={phaseFilter === 'all'}
                      onClick={() => handlePhaseFilterChange('all')}
                      color="blue"
                    />
                    <FilterButton
                      label="P"
                      isActive={phaseFilter === 'p'}
                      onClick={() => handlePhaseFilterChange('p')}
                      color="green"
                    />
                    <FilterButton
                      label="H1"
                      isActive={phaseFilter === 'h1'}
                      onClick={() => handlePhaseFilterChange('h1')}
                      color="orange"
                    />
                    <FilterButton
                      label="H2/3"
                      isActive={phaseFilter === 'h2h3'}
                      onClick={() => handlePhaseFilterChange('h2h3')}
                      color="purple"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Filter op onderwerp:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <FilterButton
                      label="Alles"
                      isActive={subjectFilter === 'all'}
                      onClick={() => handleSubjectFilterChange('all')}
                      color="blue"
                    />
                    <FilterButton
                      label="BVP"
                      isActive={subjectFilter === 'bvp'}
                      onClick={() => handleSubjectFilterChange('bvp')}
                      color="orange"
                    />
                    <FilterButton
                      label="PZW"
                      isActive={subjectFilter === 'pzw'}
                      onClick={() => handleSubjectFilterChange('pzw')}
                      color="pink"
                    />
                    <FilterButton
                      label="Minor"
                      isActive={subjectFilter === 'minor'}
                      onClick={() => handleSubjectFilterChange('minor')}
                      color="indigo"
                    />
                    <FilterButton
                      label="IPL"
                      isActive={subjectFilter === 'ipl'}
                      onClick={() => handleSubjectFilterChange('ipl')}
                      color="blue"
                    />
                    <FilterButton
                      label="Juniorstage"
                      isActive={subjectFilter === 'juniorstage'}
                      onClick={() => handleSubjectFilterChange('juniorstage')}
                      color="green"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t space-y-3">
                <button
                  onClick={() => {
                    scrollToCurrentWeek();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MapPin className="w-4 h-4" />
                  Ga naar huidige week
                </button>
                <button
                  onClick={handleResetFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset alle filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {weeks.map(week => {
          const weekKey = `${week.semester}-${week.weekCode}`;
          const weekItems = itemsByWeek.get(weekKey) || [];
          
          const isCurrentWeek = currentWeek && 
            week.semester === currentWeek.semester && 
            week.weekCode === currentWeek.weekCode;
          
          return (
            <div
              key={weekKey}
              ref={(el) => {
                if (el) {
                  weekRefs.current.set(weekKey, el);
                }
                if (isCurrentWeek) {
                  currentWeekRef.current = el;
                }
              }}
              className={isCurrentWeek ? 'scroll-mt-32' : ''}
            >
              <WeekSection
                week={week}
                items={weekItems}
                onDocumentClick={handleDocumentClick}
                isCurrentWeek={isCurrentWeek}
              />
            </div>
          );
        })}
      </div>

      <DocumentModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        documentName={modalState.documentName}
        activityTitle={modalState.activityTitle}
      />
    </div>
  );
}

export default App;