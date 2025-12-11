export interface DevotionalContent {
  date: string;
  passageReference: string;
  scriptureText: string; // Optional: In a real app we might fetch this separately, but we'll ask AI to provide a snippet.
  reflection: string;
  morningPrayer: string;
  eveningPrayer: string;
  quote: string;
  quoteAuthor: string;
  relatedVerseReference: string;
  relatedVerseText: string;
  customPassageText?: string;
  customRelatedVerseText?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type Theme = 'light' | 'sepia' | 'dark';

export interface UserProfile {
  preferences: {
    theme: Theme;
  };
  progress: {
    completedDates: string[];
  };
  lastSyncedAt: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';