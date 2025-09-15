import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Novel, Bookmark } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, LoadingSpinner, BookmarkIcon, BookmarkSolidIcon } from './icons';

// Make sure epub is available on the window object from the CDN script
declare const ePub: any;

interface ReaderViewProps {
  novel: Novel | null;
  chapterHref: string | null;
  theme: 'light' | 'dark';
  viewMode: 'epub' | 'pdf';
  onChapterChange: (href: string) => void;
  onTextReady: (text: string) => void;
  onLocationChange: (cfi: string) => void;
  onAddBookmark: () => void;
  onRemoveBookmark: (cfi: string) => void;
  bookmarks: Bookmark[];
  initialLocation: string | null;
  onLocationDisplayed: () => void;
  isLoadingNovel: boolean;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ 
    novel, 
    chapterHref, 
    theme, 
    viewMode,
    onChapterChange, 
    onTextReady,
    onLocationChange,
    onAddBookmark,
    onRemoveBookmark,
    bookmarks,
    initialLocation,
    onLocationDisplayed,
    isLoadingNovel,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [currentCfi, setCurrentCfi] = useState('');
  
  const isCurrentLocationBookmarked = bookmarks.some(b => b.cfi === currentCfi);

  const handleNext = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  const handleToggleBookmark = () => {
    if (isCurrentLocationBookmarked) {
        onRemoveBookmark(currentCfi);
    } else {
        onAddBookmark();
    }
  };
  
  useEffect(() => {
    if (viewMode === 'epub' && novel && novel.file && viewerRef.current) {
      setIsRendering(true);
      if (bookRef.current) {
          bookRef.current.destroy();
      }
      viewerRef.current.innerHTML = ''; // Clear previous content
      
      const book = ePub(novel.file);
      bookRef.current = book;
      
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "auto",
      });
      renditionRef.current = rendition;

      const locationToDisplay = initialLocation || chapterHref;
      if (locationToDisplay) {
        rendition.display(locationToDisplay).then(() => {
            if (initialLocation) onLocationDisplayed();
        });
      } else {
        rendition.display();
      }

      const darkTheme = {
        body: { 
          'background-color': '#1f2937', 
          'color': '#d1d5db',
          'font-family': 'Georgia, serif',
          'font-size': '1.1em',
          'line-height': '1.6',
          'padding': '0 2rem'
        },
        a: { 'color': '#818cf8 !important' },
      };
      
      const lightTheme = {
        body: { 
          'background-color': '#ffffff', 
          'color': '#1f2937',
          'font-family': 'Georgia, serif',
          'font-size': '1.1em',
          'line-height': '1.6',
          'padding': '0 2rem'
        },
        a: { 'color': '#4f46e5 !important' },
      };

      rendition.themes.register("dark", darkTheme);
      rendition.themes.register("light", lightTheme);
      rendition.themes.select(theme);

      book.ready.then(() => {
        setIsRendering(false);
      });
      
      rendition.on('displayed', (section: any) => {
        const currentNavItem = book.navigation.get(section.href);
        if (currentNavItem && currentNavItem.href !== chapterHref) {
            onChapterChange(currentNavItem.href);
        }
        
        const view = rendition.views().get(section.index);
        if (view) {
          const textContent = view.document.body.innerText;
          onTextReady(textContent);
        }
      });

      rendition.on('relocated', (location: any) => {
        const cfi = location.start.cfi;
        setCurrentCfi(cfi);
        onLocationChange(cfi);
      });
      
      return () => {
        if(bookRef.current) bookRef.current.destroy();
      }
    } else {
        setIsRendering(false);
    }
  }, [novel, novel?.file, initialLocation, onChapterChange, onTextReady, theme, onLocationDisplayed, viewMode, chapterHref]);

  useEffect(() => {
    if (renditionRef.current && viewMode === 'epub') {
      renditionRef.current.themes.select(theme);
    }
  }, [theme, viewMode]);
  
  if (!novel) {
    return (
        <div className="flex items-center justify-center h-full p-4 text-center">
            <div>
                <h2 className="text-xl font-semibold mb-2">Welcome to your Library</h2>
                <p>Select a novel from the sidebar to begin reading.</p>
            </div>
        </div>
    );
  }

  if (viewMode === 'pdf') {
      return novel.pdfPath ? (
          <iframe 
              src={novel.pdfPath} 
              className="w-full h-full border-none" 
              title={`PDF view of ${novel.title}`}
          ></iframe>
      ) : (
        <div className="flex items-center justify-center h-full p-4 text-center">
            <p>No PDF available for this novel.</p>
        </div>
      );
  }

  const showLoading = isLoadingNovel || isRendering;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-base-200 dark:bg-dark-base-100">
      {showLoading && <LoadingSpinner />}

      {!showLoading && (
        <button
            onClick={handleToggleBookmark}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-base-100/50 dark:bg-dark-base-200/50 hover:bg-base-100 dark:hover:bg-dark-base-200 shadow-md transition-colors"
            aria-label={isCurrentLocationBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
            {isCurrentLocationBookmarked ? (
                <BookmarkSolidIcon className="w-6 h-6 text-primary" />
            ) : (
                <BookmarkIcon className="w-6 h-6 text-base-content dark:text-dark-base-content" />
            )}
        </button>
      )}

      <div ref={viewerRef} className={`w-full h-full transition-opacity duration-300 ${showLoading ? 'opacity-0' : 'opacity-100'}`} />
      
      {!showLoading && (
        <>
            <button 
                onClick={handlePrev} 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-24 flex items-center justify-start text-base-content/30 dark:text-dark-base-content/30 hover:text-primary dark:hover:text-primary transition-colors pl-4"
                aria-label="Previous page"
            >
                <ChevronLeftIcon className="w-8 h-8"/>
            </button>
            <button 
                onClick={handleNext} 
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-24 flex items-center justify-end text-base-content/30 dark:text-dark-base-content/30 hover:text-primary dark:hover:text-primary transition-colors pr-4"
                aria-label="Next page"
            >
                <ChevronRightIcon className="w-8 h-8"/>
            </button>
        </>
      )}
    </div>
  );
};