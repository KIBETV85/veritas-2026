import React, { useState, useEffect, useRef } from 'react';
import { DevotionalContent, LoadingState } from '../types';
import { BookOpen, Share2, Loader, ChevronDown, ChevronUp, Maximize, Minimize, Sparkles, Edit, Save, X, ExternalLink, RefreshCw, Sun, Moon, Play, Stop, CheckCircle } from './Icons';
import { formatDateFull } from '../utils/dateUtils';

interface DevotionalDisplayProps {
  content: DevotionalContent | null;
  loadingState: LoadingState;
  currentDate: Date;
  onMarkComplete: () => void;
  isCompleted: boolean;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onUpdateContent: (updatedFields: Partial<DevotionalContent>) => void;
}

const fetchBibleText = async (reference: string) => {
  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.text ? data.text.trim() : null;
  } catch (error) {
    console.error("Error fetching bible text:", error);
    return null;
  }
};

const DevotionalDisplay: React.FC<DevotionalDisplayProps> = ({ 
  content, 
  loadingState, 
  currentDate, 
  onMarkComplete,
  isCompleted,
  isFullScreen,
  onToggleFullScreen,
  onUpdateContent
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passageContentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const [fullPassageText, setFullPassageText] = useState<string | null>(null);
  const [fetchedRelatedText, setFetchedRelatedText] = useState<string | null>(null);
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [isPassageExpanded, setIsPassageExpanded] = useState(false);
  const [isRelatedExpanded, setIsRelatedExpanded] = useState(false);
  const [showPassageScrollIndicator, setShowPassageScrollIndicator] = useState(false);

  // Edit State
  const [editingSection, setEditingSection] = useState<'reflection' | 'morningPrayer' | 'eveningPrayer' | 'passageText' | 'relatedVerse' | null>(null);
  const [tempText, setTempText] = useState('');

  // TTS State
  const [playingSection, setPlayingSection] = useState<'morningPrayer' | 'eveningPrayer' | null>(null);

  const isLoading = loadingState === LoadingState.LOADING;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to allow shrinking
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [tempText, editingSection]);

  // Handle Speech Synthesis cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Fetch related bible text when content changes
  useEffect(() => {
    if (content && !isLoading) {
      setFullPassageText(null);
      setFetchedRelatedText(null);
      setIsPassageExpanded(false);
      setIsRelatedExpanded(false);
      setIsBibleLoading(false);
      
      // Reset edit state on content change
      setEditingSection(null);
      setTempText('');
      
      // Reset playback
      window.speechSynthesis.cancel();
      setPlayingSection(null);
      
      // Reset scroll
      if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
          setScrollProgress(0);
      }

      // Automatically fetch related verse, but lazy load passage
      if (content.relatedVerseReference) {
        fetchBibleText(content.relatedVerseReference).then(text => {
          setFetchedRelatedText(text);
        });
      }
    } else if (isLoading) {
      setFullPassageText(null);
      setFetchedRelatedText(null);
    }
  }, [content, isLoading]);

  const handleFetchPassage = async () => {
    if (!content) return;
    
    setIsBibleLoading(true);
    const text = await fetchBibleText(content.passageReference);
    setFullPassageText(text);
    setIsBibleLoading(false);
  };

  const handleTogglePassage = () => {
    const nextState = !isPassageExpanded;
    setIsPassageExpanded(nextState);
    
    // Lazy load if expanding and text is missing and not already editing custom text
    if (nextState && !fullPassageText && !content?.customPassageText && !isLoading) {
      handleFetchPassage();
    }
  };

  // Scroll Progress Logic for main container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight <= clientHeight) {
            setScrollProgress(100);
            return;
        }
        
        const totalScroll = scrollHeight - clientHeight;
        // Clamp between 0 and 100
        const currentProgress = Math.min(100, Math.max(0, (scrollTop / totalScroll) * 100));
        setScrollProgress(currentProgress);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    window.addEventListener('resize', handleScroll);

    return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
    };
  }, [content, isPassageExpanded, editingSection, isLoading]);

  // Check overflow for passage content
  useEffect(() => {
    const checkPassageScroll = () => {
      if (passageContentRef.current && isPassageExpanded && editingSection !== 'passageText') {
        const { scrollHeight, clientHeight, scrollTop } = passageContentRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10;
        setShowPassageScrollIndicator(isScrollable && !isAtBottom);
      } else {
        setShowPassageScrollIndicator(false);
      }
    };

    // Small timeout to allow DOM layout to stabilize
    const timeoutId = setTimeout(checkPassageScroll, 100);
    window.addEventListener('resize', checkPassageScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkPassageScroll);
    };
  }, [isPassageExpanded, fullPassageText, content?.customPassageText, editingSection, isLoading]);

  const handlePassageScroll = () => {
    if (passageContentRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = passageContentRef.current;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 20;
      setShowPassageScrollIndicator(!isAtBottom);
    }
  };

  const handleShare = () => {
    if (content) {
      const text = `Veritas Devotional for ${content.date}\n"${content.passageReference}"\n\n${content.reflection}\n\nRead more at Veritas 2026.`;
      if (navigator.share) {
        navigator.share({
          title: 'Veritas 2026 Devotional',
          text: text,
        }).catch(console.error);
      } else {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    }
  };

  const startEditing = (section: 'reflection' | 'morningPrayer' | 'eveningPrayer' | 'passageText' | 'relatedVerse', text: string) => {
    // Stop any active playback
    window.speechSynthesis.cancel();
    setPlayingSection(null);

    setEditingSection(section);
    setTempText(text);
  };

  const saveEdit = () => {
    if (editingSection) {
      let update: Partial<DevotionalContent> = {};
      
      switch(editingSection) {
        case 'reflection':
          update = { reflection: tempText };
          break;
        case 'morningPrayer':
          update = { morningPrayer: tempText };
          break;
        case 'eveningPrayer':
          update = { eveningPrayer: tempText };
          break;
        case 'passageText':
          update = { customPassageText: tempText };
          break;
        case 'relatedVerse':
          update = { customRelatedVerseText: tempText };
          break;
      }

      onUpdateContent(update);
      setEditingSection(null);
      setTempText('');
    }
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setTempText('');
  };

  // Text to Speech
  const toggleSpeech = (section: 'morningPrayer' | 'eveningPrayer', text: string) => {
    if (playingSection === section) {
      window.speechSynthesis.cancel();
      setPlayingSection(null);
    } else {
      window.speechSynthesis.cancel();
      setPlayingSection(section);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setPlayingSection(null);
      };
      utterance.onerror = () => {
        setPlayingSection(null);
      };
      // Optional: Set voice or rate here if desired
      window.speechSynthesis.speak(utterance);
    }
  };

  // Resolve Texts
  const displayPassageText = content?.customPassageText || fullPassageText;
  const displayRelatedText = content?.customRelatedVerseText || fetchedRelatedText || content?.relatedVerseText;

  // Placeholder content for Skeleton Loading
  const skeletonContent = {
    passageReference: "Loading Scripture...",
    scriptureText: "...",
    reflection: "",
    morningPrayer: "",
    eveningPrayer: "",
    quote: "...",
    quoteAuthor: "",
  };

  const displayData = isLoading ? skeletonContent : (content || skeletonContent);

  if (loadingState === LoadingState.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500" role="alert">
        <p>Unable to load the devotional for this day.</p>
        <p className="text-sm mt-2">Please check your connection and try again.</p>
      </div>
    );
  }

  // Initial Empty State
  if (!isLoading && !content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-400">
        <BookOpen className="w-12 h-12 mb-4 opacity-50" aria-hidden="true" />
        <p>Select a date to begin your reading.</p>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto bg-stone-50 relative scroll-smooth">
      
      {/* Reading Progress Bar */}
      <div className="sticky top-0 left-0 right-0 h-1 bg-transparent z-30" aria-hidden="true">
           {/* Track */}
           <div className="absolute inset-0 bg-stone-200/50 w-full"></div>
           {/* Indicator */}
           <div 
             className="h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
             style={{ width: `${scrollProgress}%` }} 
           />
      </div>

      {/* Full Screen Toggle - Positioning */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onToggleFullScreen}
          className="p-2 text-stone-500 hover:text-stone-900 bg-white/90 hover:bg-white rounded-full shadow-md border border-stone-200 transition-all"
          title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
          aria-label={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
        >
           {isFullScreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        {/* Header */}
        <header className="mb-10 text-center relative">
          <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3">
            {formatDateFull(currentDate)}
          </p>
          {isLoading ? (
            <div className="h-10 bg-stone-200 rounded-lg w-2/3 mx-auto animate-pulse mb-6"></div>
          ) : (
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-6 leading-tight">
              {displayData.passageReference}
            </h1>
          )}
          
          <div className="flex justify-center gap-2">
            <button 
              onClick={handleShare}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-full text-sm font-medium text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-all shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Share this devotional"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="space-y-10">
          
          {/* 1. Scripture Snippet (Deep Emerald Card) */}
          <section className="bg-emerald-200 rounded-2xl p-8 border border-emerald-300 shadow-sm relative overflow-hidden" aria-label="Scripture Snippet">
             {/* Subtle pattern */}
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BookOpen className="w-48 h-48 text-emerald-900 transform -rotate-12 translate-x-12 -translate-y-12" />
             </div>
             
             <blockquote className="relative z-10 font-serif text-lg md:text-xl text-emerald-900 italic leading-relaxed text-center">
               <span className="text-4xl text-emerald-400/50 absolute -top-4 -left-2 font-serif select-none">“</span>
               {isLoading ? (
                 <div className="space-y-2 animate-pulse py-4">
                   <div className="h-4 bg-emerald-300/50 rounded w-full"></div>
                   <div className="h-4 bg-emerald-300/50 rounded w-5/6 mx-auto"></div>
                   <div className="h-4 bg-emerald-300/50 rounded w-4/6 mx-auto"></div>
                 </div>
               ) : (
                 displayData.scriptureText
               )}
               <span className="text-4xl text-emerald-400/50 absolute -bottom-8 -right-2 font-serif select-none">”</span>
             </blockquote>
          </section>

          {/* 2. Read Full Passage (Deep Stone Card) */}
          <section className="bg-stone-200 rounded-2xl p-1 border border-stone-300 shadow-sm overflow-hidden transition-all duration-300">
             <div className="flex items-center justify-between px-4 py-3 bg-stone-300/50 border-b border-stone-300">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleTogglePassage}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-stone-800 font-bold text-sm hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-stone-400 rounded-md p-1 disabled:opacity-50"
                    aria-expanded={isPassageExpanded}
                    aria-controls="full-passage-content"
                  >
                    {isPassageExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>Read Full Passage</span>
                  </button>
                  
                  {/* Fetch Refresh Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFetchPassage(); }}
                    disabled={isLoading}
                    className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-300 rounded-full transition-colors disabled:opacity-0"
                    title="Refresh Text from API"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBibleLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
             </div>
             
             <div 
               id="full-passage-content"
               className={`transition-all duration-500 ease-in-out bg-stone-100 ${isPassageExpanded ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}
             >
                <div className="p-6 relative">
                  {editingSection === 'passageText' ? (
                    <div className="space-y-3">
                      <textarea
                        ref={textareaRef}
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        className="w-full p-4 bg-white border border-stone-300 rounded-lg font-serif text-stone-800 leading-relaxed focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none resize-none min-h-[200px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800">Cancel</button>
                        <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-900">
                          <Save className="w-4 h-4" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Text Display Container with Scroll */}
                      <div 
                        ref={passageContentRef}
                        onScroll={handlePassageScroll}
                        className="overflow-y-auto max-h-[50vh] pr-2 scrollbar-thin scrollbar-thumb-stone-300"
                      >
                         <div className="prose prose-stone max-w-none text-stone-800 leading-loose text-sm font-serif">
                           {isBibleLoading ? (
                              <div className="flex items-center gap-2 text-stone-500 py-4">
                                <Loader className="w-4 h-4" /> Loading scripture...
                              </div>
                           ) : displayPassageText ? (
                              displayPassageText.split('\n').map((para, i) => (
                                <p key={i} className="mb-4">{para}</p>
                              ))
                           ) : (
                              <p className="italic text-stone-500">Click refresh to load text or type your own.</p>
                           )}
                         </div>

                         {/* Source Link */}
                         {!isLoading && displayData.passageReference && (
                           <a 
                             href={`https://bible-api.com/${encodeURIComponent(displayData.passageReference)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 mt-4 transition-colors"
                           >
                             <ExternalLink className="w-3 h-3" />
                             <span>View on bible-api.com</span>
                           </a>
                         )}
                      </div>
                      
                      {/* Scroll Indicator Overlay */}
                      {showPassageScrollIndicator && (
                         <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-100 via-stone-100/90 to-transparent pointer-events-none flex items-end justify-center pb-2 z-10">
                            <ChevronDown className="w-5 h-5 text-stone-400 animate-bounce" />
                         </div>
                      )}

                      {/* Edit Button for Passage */}
                      {!isLoading && (
                        <button 
                          onClick={() => startEditing('passageText', displayPassageText || '')}
                          className="absolute top-2 right-4 p-2 text-stone-400 hover:text-stone-700 bg-white/50 backdrop-blur-sm rounded-full transition-colors"
                          title="Edit Passage Text"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
             </div>
          </section>

          {/* 3. Reflection (Deep Indigo Card) */}
          <section className="bg-indigo-200 rounded-2xl p-6 md:p-8 border border-indigo-300 shadow-sm relative group" aria-label="Devotional Reflection">
            <h3 className="font-bold text-indigo-900 mb-4 uppercase tracking-widest text-xs">Devotional Reflection</h3>
            
            {editingSection === 'reflection' ? (
              <div className="bg-white/80 p-4 rounded-xl border border-indigo-300 shadow-inner animate-in fade-in zoom-in-95 duration-200">
                <textarea
                  ref={textareaRef}
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  className="w-full p-3 bg-white border border-indigo-200 rounded-lg font-serif text-stone-900 leading-relaxed focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none resize-none min-h-[200px]"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button 
                    onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-800/70 hover:text-indigo-900 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-700 text-white rounded-lg text-sm hover:bg-indigo-800 shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="text-indigo-950 leading-loose font-serif">
                  {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-indigo-300/50 rounded w-full"></div>
                      <div className="h-4 bg-indigo-300/50 rounded w-11/12"></div>
                      <div className="h-4 bg-indigo-300/50 rounded w-full"></div>
                      <div className="h-4 bg-indigo-300/50 rounded w-3/4"></div>
                      <div className="h-4 bg-indigo-300/50 rounded w-full"></div>
                    </div>
                  ) : (
                    displayData.reflection.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                    ))
                  )}
                </div>
                {!isLoading && (
                  <button 
                    onClick={() => startEditing('reflection', displayData.reflection)}
                    className="absolute -top-10 right-0 p-2 text-indigo-800/60 hover:text-indigo-900 transition-colors bg-white/30 rounded-full"
                    title="Edit Reflection"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </section>

          {/* 4. Prayers Section */}
          <section className="py-8" aria-labelledby="prayers-heading">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-stone-300 flex-1"></div>
              <h3 id="prayers-heading" className="font-serif font-bold text-xl text-stone-800">Prayers</h3>
              <div className="h-px bg-stone-300 flex-1"></div>
            </div>

            <div className="space-y-6">
              
              {/* Prayer of Jabez (Scriptural Foundation) */}
              <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl p-6 border border-stone-300 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 text-stone-500">
                    <Sparkles className="w-24 h-24" />
                 </div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3 text-stone-600">
                     <Sparkles className="w-5 h-5" />
                     <h4 className="text-sm font-bold uppercase tracking-widest">Scriptural Foundation</h4>
                   </div>
                   <p className="font-serif text-lg text-stone-900 italic leading-relaxed">
                     "Oh that you would bless me and enlarge my border, and that your hand might be with me, and that you would keep me from harm so that it might not bring me pain!"
                   </p>
                   <p className="text-right text-xs font-bold text-stone-500 mt-2">— 1 Chronicles 4:10</p>
                 </div>
              </div>

              {/* Stacked Morning & Evening Prayers */}
              <div className="flex flex-col gap-6">
                
                {/* Morning Prayer (Deep Yellow Theme - bg-yellow-400) */}
                <div className="bg-yellow-400 rounded-2xl p-6 border border-yellow-600 shadow-sm relative group w-full transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg transition-colors ${playingSection === 'morningPrayer' ? 'bg-yellow-700 text-white animate-pulse' : 'bg-white/50 text-yellow-950'}`}>
                      <Sun className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-yellow-950">Morning Prayer</h4>
                    
                    {!editingSection && !isLoading && (
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => toggleSpeech('morningPrayer', displayData.morningPrayer)}
                          className={`p-1.5 rounded-full transition-colors ${playingSection === 'morningPrayer' ? 'bg-yellow-700 text-white' : 'text-yellow-950/60 hover:text-yellow-950 hover:bg-white/30'}`}
                          title={playingSection === 'morningPrayer' ? "Stop Reading" : "Read Aloud"}
                          aria-label={playingSection === 'morningPrayer' ? "Stop Reading" : "Read Aloud"}
                        >
                          {playingSection === 'morningPrayer' ? <Stop className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => startEditing('morningPrayer', displayData.morningPrayer)}
                          className="p-1.5 text-yellow-950/60 hover:text-yellow-950 hover:bg-white/30 rounded-full transition-colors"
                          title="Edit Morning Prayer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 text-yellow-950/50">
                        <Loader className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-medium animate-pulse">Composing Morning Prayer...</span>
                    </div>
                  ) : editingSection === 'morningPrayer' ? (
                    <div className="flex flex-col">
                       <textarea
                        ref={textareaRef}
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        className="w-full p-3 bg-white/90 border border-yellow-600 rounded-lg font-serif text-stone-900 text-sm leading-relaxed focus:ring-2 focus:ring-yellow-700 focus:border-transparent outline-none resize-none min-h-[150px] mb-3"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEdit} className="text-xs font-bold text-yellow-950/70 hover:text-yellow-950 px-2 py-1">CANCEL</button>
                        <button onClick={saveEdit} className="text-xs font-bold text-white bg-yellow-800 hover:bg-yellow-900 px-3 py-1.5 rounded-md shadow-sm">SAVE</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-yellow-950 leading-relaxed font-serif text-sm pl-6 md:pl-8 border-l-4 border-yellow-700/30">
                      {displayData.morningPrayer}
                    </p>
                  )}
                </div>

                {/* Evening Prayer (Deep Pink Theme - bg-pink-400) */}
                <div className="bg-pink-400 rounded-2xl p-6 border border-pink-600 shadow-sm relative group w-full transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                     <div className={`p-1.5 rounded-lg transition-colors ${playingSection === 'eveningPrayer' ? 'bg-pink-700 text-white animate-pulse' : 'bg-white/50 text-pink-950'}`}>
                      <Moon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-pink-950">Evening Prayer</h4>

                    {!editingSection && !isLoading && (
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => toggleSpeech('eveningPrayer', displayData.eveningPrayer)}
                          className={`p-1.5 rounded-full transition-colors ${playingSection === 'eveningPrayer' ? 'bg-pink-700 text-white' : 'text-pink-950/60 hover:text-pink-950 hover:bg-white/30'}`}
                          title={playingSection === 'eveningPrayer' ? "Stop Reading" : "Read Aloud"}
                          aria-label={playingSection === 'eveningPrayer' ? "Stop Reading" : "Read Aloud"}
                        >
                          {playingSection === 'eveningPrayer' ? <Stop className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => startEditing('eveningPrayer', displayData.eveningPrayer)}
                          className="p-1.5 text-pink-950/60 hover:text-pink-950 hover:bg-white/30 rounded-full transition-colors"
                          title="Edit Evening Prayer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3 text-pink-950/50">
                        <Loader className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-medium animate-pulse">Composing Evening Prayer...</span>
                    </div>
                  ) : editingSection === 'eveningPrayer' ? (
                    <div className="flex flex-col">
                       <textarea
                        ref={textareaRef}
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        className="w-full p-3 bg-white/90 border border-pink-600 rounded-lg font-serif text-stone-900 text-sm leading-relaxed focus:ring-2 focus:ring-pink-700 focus:border-transparent outline-none resize-none min-h-[150px] mb-3"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEdit} className="text-xs font-bold text-pink-950/70 hover:text-pink-950 px-2 py-1">CANCEL</button>
                        <button onClick={saveEdit} className="text-xs font-bold text-white bg-pink-800 hover:bg-pink-900 px-3 py-1.5 rounded-md shadow-sm">SAVE</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-pink-950 leading-relaxed font-serif text-sm pl-6 md:pl-8 border-l-4 border-pink-700/30">
                      {displayData.eveningPrayer}
                    </p>
                  )}
                </div>

              </div>
            </div>
          </section>

          {/* 5. Related Verse (Deep Orange Card) */}
          <section className="border-t border-dashed border-stone-300 pt-8" aria-label="Related Verse">
            <div className="text-center max-w-xl mx-auto">
              <button 
                onClick={() => !isLoading && setIsRelatedExpanded(!isRelatedExpanded)}
                disabled={isLoading}
                className={`group flex flex-col items-center justify-center w-full focus:outline-none ${isLoading ? 'opacity-50' : ''}`}
              >
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 group-hover:text-stone-700 transition-colors flex items-center gap-2">
                  Related Verse 
                  {isRelatedExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </h4>
                
                {/* Collapsed Preview */}
                {!isRelatedExpanded && (
                  <p className="font-serif text-stone-500 italic text-sm line-clamp-1 opacity-60">
                    {isLoading ? "..." : displayRelatedText}
                  </p>
                )}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${isRelatedExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                 <div className="relative p-6 bg-orange-200 rounded-xl border border-orange-300 shadow-sm">
                    {editingSection === 'relatedVerse' ? (
                      <div className="space-y-3">
                         <textarea
                          ref={textareaRef}
                          value={tempText}
                          onChange={(e) => setTempText(e.target.value)}
                          className="w-full p-3 bg-white border border-orange-300 rounded-lg font-serif text-stone-900 leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEdit} className="text-xs font-bold text-orange-900/70 hover:text-orange-950">Cancel</button>
                          <button onClick={saveEdit} className="text-xs font-bold text-white bg-orange-700 hover:bg-orange-800 px-2 py-1 rounded">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <blockquote className="font-serif text-orange-950 italic leading-relaxed text-sm">
                          "{displayRelatedText}"
                        </blockquote>
                        <p className="text-right text-xs font-bold text-orange-800/70 mt-2">— {displayData.relatedVerseReference}</p>
                        
                        <button 
                          onClick={() => startEditing('relatedVerse', displayRelatedText || '')}
                          className="absolute top-2 right-2 p-1.5 text-orange-800/60 hover:text-orange-950 transition-colors"
                          title="Edit Related Verse"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                 </div>
              </div>
            </div>
          </section>

          {/* 6. Quote */}
          <section className="mt-16 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 rounded-2xl p-10 text-center relative overflow-hidden shadow-sm border border-stone-300 group">
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" className="text-stone-900 transform rotate-12">
                   <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
             </div>

             {/* Top Border Accent */}
             <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-b-full"></div>

             {isLoading ? (
               <div className="flex flex-col items-center gap-3 animate-pulse relative z-10">
                 <div className="h-4 bg-stone-300 rounded w-full max-w-lg"></div>
                 <div className="h-4 bg-stone-300 rounded w-2/3 max-w-md"></div>
                 <div className="h-3 bg-stone-300 rounded w-24 mt-4"></div>
               </div>
             ) : (
              <>
               <blockquote className="font-serif text-xl md:text-2xl italic leading-relaxed text-stone-800 mb-6 relative z-10">
                 "{displayData.quote}"
               </blockquote>
               <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="h-px w-8 bg-stone-400"></div>
                  <cite className="text-sm font-bold uppercase tracking-widest text-amber-700 not-italic flex items-center justify-center gap-2">
                     {displayData.quoteAuthor}
                  </cite>
                  <div className="h-px w-8 bg-stone-400"></div>
               </div>
              </>
             )}
          </section>

          {/* Mark Complete Footer */}
          <div className="pt-12 pb-20 text-center">
            <button
              onClick={onMarkComplete}
              disabled={isLoading}
              className={`
                group relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5
                ${isCompleted 
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300' 
                  : 'bg-stone-800 text-white hover:bg-stone-900 border border-stone-800'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-5 h-5" filled={true} />
                  <span>Completed</span>
                </>
              ) : (
                <span>Mark as Complete</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevotionalDisplay;