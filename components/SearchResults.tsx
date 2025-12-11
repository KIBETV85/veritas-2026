import React from 'react';
import { DevotionalContent } from '../types';
import { BookOpen } from './Icons';

interface SearchResultsProps {
  results: DevotionalContent[];
  onSelect: (date: Date) => void;
  searchQuery: string;
}

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <>{text}</>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const pattern = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-stone-900 font-bold rounded-[2px] px-0.5 shadow-sm mx-[1px]">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, searchQuery }) => {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-stone-500">
        <div className="bg-stone-100 p-4 rounded-full mb-4">
          <BookOpen className="w-6 h-6 text-stone-400" />
        </div>
        <p className="text-sm font-medium text-stone-600 mb-1">No matches found</p>
        <p className="text-xs text-stone-400">
          Try searching for a different passage or keyword in your viewed history.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-1">
        <div className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Found {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
        {results.map((item) => {
          const date = new Date(item.date);
          const lowerQuery = searchQuery.toLowerCase();
          
          // Check if the match comes from the Related Verse section
          const isRelatedMatch = (
            (item.relatedVerseReference && item.relatedVerseReference.toLowerCase().includes(lowerQuery)) ||
            (item.relatedVerseText && item.relatedVerseText.toLowerCase().includes(lowerQuery))
          );

          return (
            <button
              key={item.date}
              onClick={() => onSelect(date)}
              className="w-full text-left p-4 hover:bg-stone-50 rounded-xl transition-colors border border-transparent hover:border-stone-100 group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-serif font-semibold text-stone-900 group-hover:text-primary-900 transition-colors line-clamp-1 pr-2">
                  <HighlightText text={item.passageReference} highlight={searchQuery} />
                </span>
                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">
                   {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-2">
                <HighlightText text={item.reflection} highlight={searchQuery} />
              </p>

              {/* Display Related Verse context if it matches the search */}
              {isRelatedMatch && (
                <div className="bg-stone-100/70 p-2 rounded-lg border border-stone-200/50 mt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3 h-3 text-stone-400" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Related Match</span>
                  </div>
                  <p className="text-xs text-stone-600 italic line-clamp-2">
                    "<HighlightText text={item.relatedVerseText} highlight={searchQuery} />"
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5 text-right">
                    <HighlightText text={item.relatedVerseReference} highlight={searchQuery} />
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;