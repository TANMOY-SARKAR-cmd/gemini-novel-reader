import React, { useState, useMemo } from 'react';
import type { Novel, TOCItem } from '../types';

interface ChapterItemProps {
  item: TOCItem;
  onSelectChapter: (href: string) => void;
  currentChapterHref: string;
}

const ChapterItem: React.FC<ChapterItemProps> = ({ item, onSelectChapter, currentChapterHref }) => {
  const isSelected = item.href === currentChapterHref;
  return (
    <li>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectChapter(item.href);
        }}
        className={`block px-4 py-2 text-sm rounded-md truncate ${
          isSelected
            ? 'bg-primary/20 text-primary dark:text-white'
            : 'hover:bg-base-200 dark:hover:bg-dark-base-300'
        }`}
      >
        {item.label.trim()}
      </a>
    </li>
  );
};

interface SidebarProps {
  novels: Novel[];
  currentNovelId: string | null;
  currentChapterHref: string | null;
  onSelectChapter: (novelId: string, href: string) => void;
  onSelectNovel: (novelId: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  novels,
  currentNovelId,
  currentChapterHref,
  onSelectChapter,
  onSelectNovel,
  isOpen,
  toggleSidebar,
}) => {
  const currentNovel = novels.find(n => n.id === currentNovelId);
  
  const groupedNovels = useMemo(() => {
    return novels.reduce<Record<string, Novel[]>>((acc, novel) => {
      const bookTitle = novel.bookTitle;
      if (!acc[bookTitle]) {
        acc[bookTitle] = [];
      }
      acc[bookTitle].push(novel);
      return acc;
    }, {});
  }, [novels]);

  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>(() => {
      if (currentNovel) {
          return { [currentNovel.bookTitle]: true };
      }
      return {};
  });

  const toggleBookExpansion = (bookTitle: string) => {
    setExpandedBooks(prev => ({ ...prev, [bookTitle]: !prev[bookTitle] }));
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      ></div>
      <aside className={`fixed lg:static top-0 left-0 h-full w-72 bg-base-100 dark:bg-dark-base-200 shadow-lg flex flex-col z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-base-200 dark:border-dark-base-300">
            <h2 className="text-xl font-bold">My Library</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {Object.entries(groupedNovels).map(([bookTitle, volumes]) => (
            <div key={bookTitle}>
                <div 
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-base-200 dark:hover:bg-dark-base-300"
                    onClick={() => toggleBookExpansion(bookTitle)}
                >
                    <h3 className="font-semibold text-base-content dark:text-dark-base-content">{bookTitle}</h3>
                    <svg className={`w-4 h-4 transition-transform ${expandedBooks[bookTitle] ? 'rotate-90' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
                {expandedBooks[bookTitle] && (
                    <ul className="mt-1 ml-2 pl-2 border-l border-base-300 dark:border-dark-base-300 space-y-1">
                        {volumes.map(volume => (
                            <li key={volume.id}>
                                <div 
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${volume.id === currentNovelId ? 'bg-primary/10' : 'hover:bg-base-200 dark:hover:bg-dark-base-300'}`}
                                    onClick={() => onSelectNovel(volume.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={volume.coverUrl ?? 'https://placehold.co/40x60/E5E7EB/1F2937?text=...'} alt={volume.title} className="w-8 h-12 object-cover rounded-sm shadow-sm bg-base-200" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm text-base-content dark:text-dark-base-content truncate">{volume.title}</h4>
                                            {volume.author && <p className="text-xs text-base-content/70 dark:text-dark-base-content/70">{volume.author}</p>}
                                        </div>
                                    </div>
                                </div>
                                {volume.id === currentNovelId && volume.toc && (
                                    <ul className="mt-2 ml-4 pl-4 border-l border-base-300 dark:border-dark-base-300 space-y-1">
                                        {volume.toc.map(item => (
                                            <ChapterItem 
                                                key={item.id} 
                                                item={item} 
                                                onSelectChapter={(href) => onSelectChapter(volume.id, href)}
                                                currentChapterHref={currentChapterHref ?? ''}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            ))}
        </div>
      </aside>
    </>
  );
};