import React from 'react';
import { SunIcon, MoonIcon, BookOpenIcon, SparklesIcon, Bars3Icon } from './icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleGeminiPanel: () => void;
  viewMode: 'epub' | 'pdf';
  setViewMode: (mode: 'epub' | 'pdf') => void;
  isPdfAvailable: boolean;
}

const ViewModeToggle: React.FC<{ viewMode: 'epub' | 'pdf', setViewMode: (mode: 'epub' | 'pdf') => void, isPdfAvailable: boolean }> = ({ viewMode, setViewMode, isPdfAvailable }) => {
  if (!isPdfAvailable) {
    return <div className="w-24">&nbsp;</div>; // Reserve space
  }
  return (
    <div className="flex items-center rounded-lg bg-base-200 dark:bg-dark-base-300 p-1">
      <button
        onClick={() => setViewMode('epub')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'epub' ? 'bg-white dark:bg-dark-base-100 shadow' : 'text-base-content/70 dark:text-dark-base-content/70'}`}
        aria-pressed={viewMode === 'epub'}
      >
        EPUB
      </button>
      <button
        onClick={() => setViewMode('pdf')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'pdf' ? 'bg-white dark:bg-dark-base-100 shadow' : 'text-base-content/70 dark:text-dark-base-content/70'}`}
        aria-pressed={viewMode === 'pdf'}
      >
        PDF
      </button>
    </div>
  );
};


export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, toggleSidebar, toggleGeminiPanel, viewMode, setViewMode, isPdfAvailable }) => {
  return (
    <header className="bg-base-100 dark:bg-dark-base-200 shadow-md p-3 flex justify-between items-center z-20">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-base-content dark:text-dark-base-content">
            <Bars3Icon className="w-6 h-6"/>
        </button>
        <div className="flex items-center gap-2">
          <BookOpenIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content hidden sm:block">
            Gemini Reader
          </h1>
        </div>
      </div>
      
      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isPdfAvailable={isPdfAvailable} />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-base-200 dark:hover:bg-dark-base-300 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
        <button
          onClick={toggleGeminiPanel}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
          aria-label="Toggle Gemini Features"
          disabled={viewMode === 'pdf'}
        >
          <SparklesIcon className="w-5 h-5" />
          <span className="hidden md:inline">Gemini Tools</span>
        </button>
      </div>
    </header>
  );
};