import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReaderView } from './components/ReaderView';
import { GeminiPanel } from './components/GeminiPanel';
import { 
    addBookmark as dbAddBookmark, 
    deleteBookmark as dbDeleteBookmark, 
    getBookmarksForNovel 
} from './services/bookmarkService';
import type { Novel, TOCItem, Bookmark } from './types';
import { LoadingSpinner } from './components/icons';

// Make sure epub is available on the window object from the CDN script
declare const ePub: any;

interface LibraryBookConfig {
  title: string;
  volumes: string[]; // e.g., ["Volume 01", "Volume 02"] or ["Frankenstein"] for single-volume books
}

// --- LIBRARY CONFIGURATION ---
// This is the single source of truth for your library.
// Add your novels here, following the directory structure:
// /epubs/[Book Title]/[Volume Name].epub
// /pdfs/[Book Title]/[Volume Name].pdf
const LIBRARY_CONFIG: LibraryBookConfig[] = [
  {
    title: "Knight's & Magic",
    volumes: ["Volume 01"],
  },
  {
    title: "Frankenstein",
    volumes: ["frankenstein"],
  },
  {
    title: "Pride and Prejudice",
    volumes: ["pride-and-prejudice"],
  },
  {
    title: "Alice's Adventures in Wonderland",
    volumes: ["alice"],
  }
];

// Helper function to create a URL-friendly slug
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
  const [currentChapterHref, setCurrentChapterHref] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNovel, setIsLoadingNovel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGeminiPanelOpen, setIsGeminiPanelOpen] = useState(false);
  
  const [currentChapterText, setCurrentChapterText] = useState('');
  const [currentNovelText, setCurrentNovelText] = useState('');
  
  const [currentCfi, setCurrentCfi] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [locationToDisplay, setLocationToDisplay] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'epub' | 'pdf'>('epub');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Process the library config into a flat list of novel stubs on initial load
  useEffect(() => {
    try {
      const novelStubs: Novel[] = LIBRARY_CONFIG.flatMap(bookConfig => 
        bookConfig.volumes.map(volumeName => {
          const bookDir = slugify(bookConfig.title);
          const volumeFile = slugify(volumeName);
          const isSingleVolume = bookConfig.volumes.length === 1;

          return {
            id: `${bookDir}-${volumeFile}`,
            title: isSingleVolume ? bookConfig.title : volumeName,
            bookTitle: bookConfig.title,
            epubPath: `/epubs/${bookDir}/${volumeFile}.epub`,
            pdfPath: `/pdfs/${bookDir}/${volumeFile}.pdf`,
          };
        })
      );
      setNovels(novelStubs);

      if (novelStubs.length > 0) {
        const lastNovelId = localStorage.getItem('lastNovelId');
        const novelToLoad = novelStubs.find(n => n.id === lastNovelId) || novelStubs[0];
        setCurrentNovelId(novelToLoad.id);
      }
    } catch (err) {
      console.error("Failed to process library configuration.", err);
      setError("The library configuration is invalid.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lazy-load novel data when a new novel is selected
  useEffect(() => {
    const loadNovelData = async () => {
      if (!currentNovelId) return;
      
      const novelToLoad = novels.find(n => n.id === currentNovelId);
      if (!novelToLoad || novelToLoad.file) { // Already loaded
        const lastChapterHref = localStorage.getItem(`lastChapterHref_${novelToLoad?.id}`);
        const firstChapterHref = novelToLoad?.toc?.[0]?.href || null;
        const hrefToLoad = lastChapterHref || firstChapterHref;
        setCurrentChapterHref(hrefToLoad);
        setLocationToDisplay(hrefToLoad);
        return;
      };

      setIsLoadingNovel(true);
      setError(null);

      try {
        const response = await fetch(novelToLoad.epubPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${novelToLoad.epubPath}: Make sure the file exists and the server is configured to serve it.`);
        }
        const fileBuffer = await response.arrayBuffer();
        
        const book = ePub(fileBuffer);
        await book.ready;
        
        const coverUrl = await book.coverUrl();
        const metadata = await book.loaded.metadata;

        const toc: TOCItem[] = book.navigation.toc.map((item: any) => ({
            id: item.id,
            href: item.href,
            label: item.label.trim(),
        }));
        
        const fullyLoadedNovel: Novel = {
            ...novelToLoad,
            author: metadata.creator,
            coverUrl,
            toc,
            file: fileBuffer,
        };
        book.destroy();
        
        setNovels(currentNovels => currentNovels.map(n => n.id === currentNovelId ? fullyLoadedNovel : n));

        const lastChapterHref = localStorage.getItem(`lastChapterHref_${fullyLoadedNovel.id}`);
        const firstChapterHref = fullyLoadedNovel.toc?.[0]?.href || null;
        const hrefToLoad = lastChapterHref || firstChapterHref;
        setCurrentChapterHref(hrefToLoad);
        setLocationToDisplay(hrefToLoad);

      } catch (err) {
        console.error(`Failed to load novel: ${novelToLoad.title}`, err);
        setError(`Failed to load novel "${novelToLoad.bookTitle} - ${novelToLoad.title}". Please check the file path and ensure it's accessible. (${(err as Error).message})`);
      } finally {
        setIsLoadingNovel(false);
      }
    };
    
    loadNovelData();
  }, [currentNovelId, novels]); // Added `novels` dependency to re-check if novel is loaded


  useEffect(() => {
    if (currentNovelId) {
      const novelBookmarks = getBookmarksForNovel(currentNovelId);
      setBookmarks(novelBookmarks);
    } else {
      setBookmarks([]);
    }
  }, [currentNovelId]);
  
  const getNovelText = useCallback(async (novel: Novel): Promise<string> => {
      if (!novel.file || novel.file.byteLength === 0) return "";
      const book = ePub(novel.file);
      await book.ready;
      let fullText = '';
      const processed = new Set();
      for (const item of book.spine.items) {
          if (processed.has(item.href)) continue;
          try {
            const section = await book.load(item.href);
            const el = document.createElement('div');
            el.innerHTML = await (section as any).text();
            fullText += el.innerText + '\n\n';
            processed.add(item.href);
          } catch (e) {
              console.warn(`Could not load section ${item.href}`, e);
          }
      }
      book.destroy();
      return fullText;
  }, []);

  useEffect(() => {
      const fetchNovelText = async () => {
          const currentNovel = novels.find(n => n.id === currentNovelId);
          if (currentNovel && currentNovel.file) { // Only if fully loaded
              setCurrentNovelText(''); // Clear old text
              const text = await getNovelText(currentNovel);
              setCurrentNovelText(text);
          }
      };
      if (currentNovelId) {
          fetchNovelText();
      }
  }, [currentNovelId, novels, getNovelText]);


  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  };
  
  const handleSelectNovel = (novelId: string) => {
      if (novelId !== currentNovelId) {
          setCurrentNovelId(novelId);
          setViewMode('epub'); // Default to EPUB view when changing novels
          localStorage.setItem('lastNovelId', novelId);
      }
      setIsSidebarOpen(false);
  };

  const handleSelectChapter = (novelId: string, href: string) => {
    setCurrentNovelId(novelId);
    setCurrentChapterHref(href);
    setLocationToDisplay(href);
    setViewMode('epub'); // Switch to EPUB view when a chapter is selected
    localStorage.setItem('lastNovelId', novelId);
    localStorage.setItem(`lastChapterHref_${novelId}`, href);
    if(window.innerWidth < 1024) { // Close sidebar on mobile after selection
      setIsSidebarOpen(false);
    }
  };
  
  const handleChapterChangeFromReader = useCallback((href: string) => {
    if(currentNovelId) {
      setCurrentChapterHref(href);
      localStorage.setItem(`lastChapterHref_${currentNovelId}`, href);
    }
  }, [currentNovelId]);

  const handleAddBookmark = useCallback((cfi: string) => {
    const currentNovel = novels.find(n => n.id === currentNovelId);
    if (!currentNovel || !cfi) return;

    const currentChapter = currentNovel.toc?.find(item => item.href === currentChapterHref);
    
    const newBookmark: Bookmark = {
        id: `${currentNovel.id}-${Date.now()}`,
        novelId: currentNovel.id,
        cfi: cfi,
        label: currentChapter?.label.trim() ?? 'Bookmark',
        createdAt: Date.now(),
    };
    dbAddBookmark(newBookmark);
    setBookmarks(prev => [newBookmark, ...prev].sort((a,b) => b.createdAt - a.createdAt));
  }, [currentNovelId, currentChapterHref, novels]);

  const handleRemoveBookmark = useCallback((cfi: string) => {
    const bookmarkToRemove = bookmarks.find(b => b.cfi === cfi);
    if (bookmarkToRemove) {
        dbDeleteBookmark(bookmarkToRemove.id);
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkToRemove.id));
    }
  }, [bookmarks]);
  
  const handleGoToBookmark = useCallback((cfi: string) => {
      setViewMode('epub'); // Ensure we are in epub mode to show bookmark
      setLocationToDisplay(cfi);
  }, []);

  const currentNovel = novels.find(n => n.id === currentNovelId);

  if (isLoading) {
      return <div className="w-screen h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }
  
  if (error) {
    return (
        <div className="w-screen h-screen flex items-center justify-center p-8 text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            <div>
                <h2 className="text-2xl font-bold mb-4">Error Loading Library</h2>
                <p className="max-w-xl">{error}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        toggleGeminiPanel={() => setIsGeminiPanelOpen(!isGeminiPanelOpen)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isPdfAvailable={!!currentNovel?.pdfPath}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          novels={novels}
          currentNovelId={currentNovelId}
          currentChapterHref={currentChapterHref}
          onSelectChapter={handleSelectChapter}
          onSelectNovel={handleSelectNovel}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 h-full overflow-y-auto relative">
          <ReaderView 
            novel={currentNovel} 
            chapterHref={currentChapterHref} 
            initialLocation={locationToDisplay}
            onLocationDisplayed={useCallback(() => setLocationToDisplay(null), [])}
            theme={theme} 
            viewMode={viewMode}
            onChapterChange={handleChapterChangeFromReader}
            onTextReady={setCurrentChapterText}
            onLocationChange={setCurrentCfi}
            onAddBookmark={handleAddBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            bookmarks={bookmarks}
            isLoadingNovel={isLoadingNovel}
          />
        </main>
        <GeminiPanel 
          currentChapterText={currentChapterText} 
          currentNovelText={currentNovelText}
          isOpen={isGeminiPanelOpen}
          togglePanel={() => setIsGeminiPanelOpen(!isGeminiPanelOpen)}
          bookmarks={bookmarks}
          onGoToBookmark={handleGoToBookmark}
          onDeleteBookmark={(id) => {
            dbDeleteBookmark(id);
            setBookmarks(prev => prev.filter(b => b.id !== id));
          }}
          isPdfMode={viewMode === 'pdf'}
        />
      </div>
    </div>
  );
}

export default App;