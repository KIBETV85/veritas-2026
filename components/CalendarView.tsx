import React, { useState } from 'react';
import { months, generateCalendarGrid, isSameDay, formatDateFull } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, CheckCircle, Info, Sun, Moon, Coffee, Cloud, CloudOff, AlertCircle, BookOpen } from './Icons';
import { Theme, SyncStatus } from '../types';

interface CalendarViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  completedDates: string[];
  onShowAbout: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  syncStatus: SyncStatus;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  currentDate, 
  onDateSelect, 
  completedDates, 
  onShowAbout,
  theme,
  onThemeChange,
  syncStatus
}) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const calendarDays = generateCalendarGrid(viewDate.getFullYear(), viewDate.getMonth(), currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Identify the real "Today" (System Date)
  const today = new Date();
  
  // Calculate Progress
  const progressPercentage = Math.round((completedDates.length / 365) * 100);

  return (
    <div className="flex flex-col h-full bg-stone-100 border-r border-stone-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stone-300 bg-stone-200">
        <h2 className="text-xl font-serif font-bold text-stone-900">
          {months[viewDate.getMonth()]} <span className="text-stone-500 font-sans font-normal">{viewDate.getFullYear()}</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-stone-300 rounded-full transition-colors text-stone-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-stone-300 rounded-full transition-colors text-stone-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-stone-100">
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-bold text-stone-500 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isSelected = isSameDay(date, currentDate);
            const isToday = isSameDay(date, today);
            const isCompleted = completedDates.includes(date.toDateString());
            
            // Define Styles
            let buttonClasses = `
              relative h-14 md:h-16 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
            `;

            if (!isCurrentMonth) {
              buttonClasses += 'opacity-30 cursor-default border-transparent text-stone-500';
            } else {
              buttonClasses += 'cursor-pointer ';
              
              if (isSelected) {
                // Priority 1: Selected (Deep Amber)
                buttonClasses += 'bg-amber-700 text-white shadow-lg border-amber-800 hover:bg-amber-800';
              } else if (isToday) {
                // Priority 2: Today (Richer Amber Tint)
                buttonClasses += 'bg-amber-200 text-stone-900 border-2 border-amber-400 font-bold shadow-sm z-10';
              } else if (isCompleted) {
                // Priority 3: Completed (Deep Green Tint)
                buttonClasses += 'bg-emerald-200/50 text-emerald-900 border-emerald-300 hover:border-emerald-400';
              } else {
                // Default
                buttonClasses += 'text-stone-700 bg-white border-stone-200 hover:bg-stone-200 hover:border-stone-300';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => onDateSelect(date)}
                disabled={!isCurrentMonth}
                className={buttonClasses}
                title={isToday ? "Today" : formatDateFull(date)}
              >
                <span className={`text-sm z-10 flex items-center justify-center gap-1 ${isSelected || isToday ? 'font-bold' : 'font-medium'}`}>
                  {date.getDate()}
                  {isSelected && <BookOpen className="w-3 h-3 text-amber-100" />}
                </span>
                
                {isCompleted && (
                  <div className={`mt-0.5 ${isSelected ? 'text-amber-200' : 'text-emerald-600'}`}>
                    <CheckCircle className="w-3.5 h-3.5" filled={true} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Footer Stats & Controls */}
      <div className="p-6 bg-stone-200 border-t border-stone-300">
        
        {/* Sync Status & Label */}
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest pb-1">Yearly Progress</span>
          
          <div className="flex items-center gap-2 h-5">
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-stone-600 bg-stone-300 rounded-full" title="Syncing...">
                <Cloud className="w-3 h-3 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Syncing</span>
              </div>
            )}
            {syncStatus === 'synced' && (
              <Cloud className="w-4 h-4 text-stone-400" title="Synced" />
            )}
            {syncStatus === 'offline' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-stone-300 rounded-full text-stone-700 transition-colors" title="Offline">
                <CloudOff className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-200 rounded-full text-red-800 transition-colors" title="Sync Error">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Error</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Stats */}
        <div className="flex items-end justify-between mb-2">
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-serif font-bold text-stone-900">{completedDates.length}</span>
                <span className="text-xs text-stone-600 font-medium">days</span>
            </div>
            <span className="text-xs font-bold text-stone-800 bg-stone-300 px-2 py-1 rounded-full border border-stone-400">
                {progressPercentage}%
            </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-300 rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className="bg-amber-600 h-2 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.max(2, (completedDates.length / 365) * 100)}%` }}
            ></div>
        </div>

        {/* Footer Controls */}
        <div className="mt-6 flex items-center justify-between gap-2 pt-4 border-t border-stone-300">
          <div className="flex bg-stone-300 p-1 rounded-lg">
            <button 
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              title="Light Mode"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onThemeChange('sepia')}
              className={`p-1.5 rounded-md transition-all ${theme === 'sepia' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              title="Sepia Mode"
            >
              <Coffee className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              title="Dark Mode"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={onShowAbout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors rounded-lg hover:bg-stone-300"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;