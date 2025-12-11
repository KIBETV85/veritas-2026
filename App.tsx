import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CalendarView from './components/CalendarView';
import DevotionalDisplay from './components/DevotionalDisplay';
import AboutModal from './components/AboutModal';
import SearchResults from './components/SearchResults';
import { DevotionalContent, LoadingState, Theme, SyncStatus } from './types';
import { fetchDevotionalForDate } from './services/geminiService';
import { syncService } from './services/syncService';
import { formatDateFull } from './utils/dateUtils';
import { BookOpen, Search, X } from './components/Icons';

const App: React.FC = () => {
  // Default to Jan 1, 2026 as per requirements
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 0, 1));
  const [content, setContent] = useState<DevotionalContent | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  
  // Synced Data
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [cache, setCache] = useState<Record<string, DevotionalContent>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const [isFullScreen, setIsFullScreen] = useState(false); // Full screen read mode
  const [showAbout, setShowAbout] = useState(false);
  
  // Search State
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialization: Load User Profile
  useEffect(() => {
    const initApp = async () => {
      try {
        const profile = await syncService.loadData();
        setCompletedDates(profile.progress.completedDates);
        setTheme(profile.preferences.theme);
      } catch (e) {
        console.error("Failed to load user profile", e);
        setSyncStatus('error');
      } finally {
        setInitialLoadComplete(true);
        
        // Check screen size for sidebar
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        }
      }
    };
    initApp();
  }, []);

  // Monitor Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save changes to SyncService
  const persistChanges = useCallback(async (newTheme: Theme, newCompletedDates: string[]) => {
    // If offline, we still save locally via the service, but status reflects connection
    if (!navigator.onLine) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('syncing');
    }

    try {
      await syncService.saveData({
        preferences: { theme: newTheme },
        progress: { completedDates: newCompletedDates },
        lastSyncedAt: Date.now()
      });
      
      if (navigator.onLine) {
        setSyncStatus('synced');
      }
    } catch (e) {
      console.error("Sync failed", e);
      setSyncStatus('error');
    }
  }, []);

  // Automatic Sync Effect
  useEffect(() => {
    if (!initialLoadComplete) return;

    // Debounce or just call directly (mock service handles delay)
    persistChanges(theme, completedDates);
  }, [theme, completedDates, initialLoadComplete, persistChanges]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Automatic sync handled by useEffect
  };

  const toggleComplete = () => {
    const key = currentDate.toDateString();
    let newCompleted;
    if (completedDates.includes(key)) {
      newCompleted = completedDates.filter(d => d !== key);
    } else {
      newCompleted = [...completedDates, key];
    }
    setCompletedDates(newCompleted);
    // Automatic sync handled by useEffect
  };

  const dateKey = currentDate.toDateString();

  const loadContent = useCallback(async (date: Date) => {
    const key = date.toDateString();
    
    // Check cache first
    if (cache[key]) {
      setContent(cache[key]);
      setLoadingState(LoadingState.SUCCESS);
      return;
    }

    setLoadingState(LoadingState.LOADING);
    try {
      const formattedDate = formatDateFull(date);
      const data = await fetchDevotionalForDate(formattedDate);
      
      setCache(prev => ({ ...prev, [key]: data }));
      setContent(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      setLoadingState(LoadingState.ERROR);
    }
  }, [cache]);

  useEffect(() => {
    loadContent(currentDate);
  }, [currentDate, loadContent]);

  const handleContentUpdate = (updatedFields: Partial<DevotionalContent>) => {
    if (!content) return;
    
    const updatedContent = { ...content, ...updatedFields };
    setContent(updatedContent);
    
    // Update Cache so if we navigate away and back, changes persist (in memory)
    const key = currentDate.toDateString();
    setCache(prev => ({
      ...prev,
      [key]: updatedContent
    }));
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    // Close search on select
    setIsSearchMode(false);
    setSearchQuery('');
  };

  // Filter cache for search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    
    return (Object.values(cache) as DevotionalContent[])
      .filter(item => {
        return (
          item.passageReference.toLowerCase().includes(lowerQuery) ||
          item.scriptureText.toLowerCase().includes(lowerQuery) ||
          item.reflection.toLowerCase().includes(lowerQuery) ||
          item.morningPrayer.toLowerCase().includes(lowerQuery) ||
          item.eveningPrayer.toLowerCase().includes(lowerQuery) ||
          (item.relatedVerseReference && item.relatedVerseReference.toLowerCase().includes(lowerQuery)) ||
          (item.relatedVerseText && item.relatedVerseText.toLowerCase().includes(lowerQuery))
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [cache, searchQuery]);

  return (
    <div data-theme={theme} className="flex h-screen w-screen overflow-hidden bg-stone-100 transition-colors duration-300">
      
      {/* Mobile Toggle - Hide if full screen mode is active to avoid clutter */}
      {!isFullScreen && (
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white rounded-full shadow-lg text-stone-800 border border-stone-300"
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Sidebar (Calendar & Search) */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-40 w-full md:w-80 lg:w-96 bg-stone-100 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isFullScreen ? 'md:hidden' : 'md:translate-x-0 md:relative'}
        `}
      >
         <div className="h-full flex flex-col">
           {/* Sidebar Header */}
           <div className="p-6 pb-4 border-b border-stone-300 bg-stone-200">
             <div className="flex justify-between items-start mb-2">
               <div>
                 <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Veritas 2026</h1>
                 <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Reading Guide</p>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => {
                     setIsSearchMode(!isSearchMode);
                     if (!isSearchMode) setTimeout(() => document.getElementById('search-input')?.focus(), 100);
                   }}
                   className={`p-2 rounded-full transition-colors ${isSearchMode ? 'bg-stone-300 text-stone-900' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-300'}`}
                   title="Search history"
                 >
                   <Search className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => setSidebarOpen(false)}
                   className="md:hidden p-2 text-stone-500 hover:text-stone-800"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
             </div>

             {/* Search Bar */}
             <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchMode ? 'max-h-16 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
               <div className="relative">
                 <input
                   id="search-input"
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search passages, themes..."
                   className="w-full pl-10 pr-4 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all text-stone-800"
                 />
                 <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
               </div>
             </div>
           </div>
           
           {/* Sidebar Content */}
           <div className="flex-1 overflow-hidden bg-stone-100">
             {isSearchMode && searchQuery ? (
               <SearchResults 
                 results={searchResults} 
                 onSelect={handleDateSelect}
                 searchQuery={searchQuery}
               />
             ) : (
               <CalendarView 
                 currentDate={currentDate} 
                 onDateSelect={handleDateSelect}
                 completedDates={completedDates}
                 onShowAbout={() => setShowAbout(true)}
                 theme={theme}
                 onThemeChange={handleThemeChange}
                 syncStatus={syncStatus}
               />
             )}
           </div>
         </div>
      </div>

      {/* Main Content (Devotional) */}
      <main className="flex-1 h-full relative w-full bg-stone-50">
        {/* Mobile Header Spacer - hide if full screen is active (even on desktop, logic safety) */}
        {!isFullScreen && <div className="md:hidden h-16 w-full bg-stone-200 border-b border-stone-300"></div>}
        
        <DevotionalDisplay 
          content={content} 
          loadingState={loadingState}
          currentDate={currentDate}
          onMarkComplete={toggleComplete}
          isCompleted={completedDates.includes(dateKey)}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          onUpdateContent={handleContentUpdate}
        />
      </main>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && !isFullScreen && (
        <div 
          className="fixed inset-0 bg-stone-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

    </div>
  );
};

export default App;