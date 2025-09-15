import React, { useState } from 'react';
import { generateChapterSummary, extractEntities, semanticSearchInNovel } from '../services/geminiService';
import type { Character, Place, SearchResult, Bookmark } from '../types';
import { LoadingSpinner, XMarkIcon, TrashIcon, SparklesIcon } from './icons';

interface GeminiPanelProps {
  currentChapterText: string;
  currentNovelText: string;
  isOpen: boolean;
  togglePanel: () => void;
  bookmarks: Bookmark[];
  onGoToBookmark: (cfi: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  isPdfMode: boolean;
}

type ActiveTab = 'summary' | 'entities' | 'search' | 'bookmarks';

export const GeminiPanel: React.FC<GeminiPanelProps> = ({ 
    currentChapterText, 
    currentNovelText, 
    isOpen, 
    togglePanel,
    bookmarks,
    onGoToBookmark,
    onDeleteBookmark,
    isPdfMode,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateChapterSummary(currentChapterText);
      setSummary(result);
    } catch (e) {
      setError('Could not generate summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractEntities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractEntities(currentChapterText);
      setCharacters(result.characters || []);
      setPlaces(result.places || []);
    } catch (e) {
      setError('Could not extract entities.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const results = await semanticSearchInNovel(searchQuery, currentNovelText);
      setSearchResults(results || []);
    } catch (e) {
        setError('Search failed.');
    } finally {
        setIsLoading(false);
    }
  };

  const TabButton: React.FC<{ tabId: ActiveTab, label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
        activeTab === tabId ? 'bg-base-100 dark:bg-dark-base-100 border-b-2 border-primary' : 'text-base-content/70 dark:text-dark-base-content/70 hover:bg-base-200/50 dark:hover:bg-dark-base-300/50'
      }`}
    >
      {label}
    </button>
  );
  
  const renderContent = () => {
    if (isPdfMode) {
      return (
        <div className="flex items-center justify-center h-full text-center">
            <div>
                <SparklesIcon className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-lg">Gemini Tools Unavailable</h3>
                <p className="text-base-content/70 dark:text-dark-base-content/70 max-w-xs">
                    AI features are not available for PDF view. Please switch back to EPUB mode to use Gemini Tools.
                </p>
            </div>
        </div>
      )
    }

    return (
        <>
          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
          
          {activeTab === 'summary' && (
            <div>
              <button onClick={handleGenerateSummary} disabled={isLoading || !currentChapterText} className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-focus disabled:bg-primary/50 transition-colors mb-4">
                {isLoading ? 'Generating...' : 'Generate Chapter Summary'}
              </button>
              {isLoading && activeTab === 'summary' && <LoadingSpinner />}
              {summary && <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{summary}</div>}
            </div>
          )}

          {activeTab === 'entities' && (
            <div>
              <button onClick={handleExtractEntities} disabled={isLoading || !currentChapterText} className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-focus disabled:bg-primary/50 transition-colors mb-4">
                {isLoading ? 'Extracting...' : 'Find Characters & Places'}
              </button>
              {isLoading && activeTab === 'entities' && <LoadingSpinner />}
              {(characters.length > 0 || places.length > 0) && (
                <div className="space-y-6">
                    {characters.length > 0 && <div>
                        <h3 className="font-bold text-lg mb-2">Characters</h3>
                        <ul className="space-y-3">{characters.map(c => <li key={c.name} className="p-3 bg-base-200 dark:bg-dark-base-200 rounded-md"><strong className="block">{c.name}</strong><p className="text-sm">{c.description}</p></li>)}</ul>
                    </div>}
                    {places.length > 0 && <div>
                        <h3 className="font-bold text-lg mb-2">Places</h3>
                        <ul className="space-y-3">{places.map(p => <li key={p.name} className="p-3 bg-base-200 dark:bg-dark-base-200 rounded-md"><strong className="block">{p.name}</strong><p className="text-sm">{p.description}</p></li>)}</ul>
                    </div>}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'search' && (
            <div>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                  <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in this novel..." className="flex-grow p-2 border rounded-md bg-transparent border-base-300 dark:border-dark-base-300 focus:ring-primary focus:border-primary" />
                  <button type="submit" disabled={isLoading || !currentNovelText} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-focus disabled:bg-primary/50">Search</button>
              </form>
              <p className="text-xs text-center text-base-content/60 dark:text-dark-base-content/60 mb-4">Semantic search powered by Gemini. Searches the entire current novel.</p>
              {isLoading && activeTab === 'search' && <LoadingSpinner />}
              <div className="space-y-4">
                {searchResults.map((r, i) => (
                    <div key={i} className="p-3 bg-base-200 dark:bg-dark-base-200 rounded-md">
                        <blockquote className="border-l-4 border-primary pl-3 italic mb-2">"{r.quote}"</blockquote>
                        <p className="text-sm">{r.context}</p>
                    </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div>
                <h3 className="font-bold text-xl mb-4">Bookmarks</h3>
                {bookmarks.length > 0 ? (
                    <ul className="space-y-3">
                        {bookmarks.map(bookmark => (
                            <li key={bookmark.id} className="p-3 bg-base-200 dark:bg-dark-base-200 rounded-md group">
                                <div className="flex justify-between items-start">
                                    <button
                                        onClick={() => {
                                            onGoToBookmark(bookmark.cfi);
                                            togglePanel(); // Close panel after navigation
                                        }}
                                        className="text-left flex-1"
                                    >
                                        <strong className="block text-primary hover:underline">{bookmark.label}</strong>
                                        <p className="text-xs text-base-content/50 dark:text-dark-base-content/50 mt-2">{new Date(bookmark.createdAt).toLocaleString()}</p>
                                    </button>
                                    <button 
                                        onClick={() => onDeleteBookmark(bookmark.id)}
                                        className="p-1 rounded-full text-base-content/50 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                        aria-label="Delete bookmark"
                                    >
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-base-content/70 dark:text-dark-base-content/70 py-8">
                        No bookmarks for this novel yet. Click the bookmark icon while reading to save your position.
                    </p>
                )}
            </div>
          )}
        </>
    );
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={togglePanel}></div>
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-base-200 dark:bg-dark-base-200 shadow-2xl flex flex-col z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-base-300 dark:border-dark-base-300 bg-base-100 dark:bg-dark-base-200">
          <h2 className="text-xl font-bold">Gemini Tools</h2>
          <button onClick={togglePanel} className="p-1 rounded-full hover:bg-base-300 dark:hover:bg-dark-base-300"><XMarkIcon /></button>
        </div>

        {!isPdfMode && (
          <div className="border-b border-base-300 dark:border-dark-base-300 bg-base-100 dark:bg-dark-base-200 px-2 pt-2">
              <nav className="flex gap-2 overflow-x-auto">
                  <TabButton tabId="summary" label="Summary" />
                  <TabButton tabId="entities" label="Entities" />
                  <TabButton tabId="search" label="Search" />
                  <TabButton tabId="bookmarks" label="Bookmarks" />
              </nav>
          </div>
        )}

        <div className="flex-grow overflow-y-auto p-6 bg-base-100 dark:bg-dark-base-100">
          {renderContent()}
        </div>
      </aside>
    </>
  );
};