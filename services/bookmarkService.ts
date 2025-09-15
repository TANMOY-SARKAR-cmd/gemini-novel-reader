import type { Bookmark } from '../types';

const BOOKMARKS_KEY = 'gemini-novel-reader-bookmarks';

function getAllBookmarksFromStorage(): Bookmark[] {
  try {
    const storedBookmarks = localStorage.getItem(BOOKMARKS_KEY);
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  } catch (error) {
    console.error("Failed to parse bookmarks from localStorage", error);
    return [];
  }
}

function saveAllBookmarksToStorage(bookmarks: Bookmark[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function getBookmarksForNovel(novelId: string): Bookmark[] {
  const allBookmarks = getAllBookmarksFromStorage();
  return allBookmarks.filter(b => b.novelId === novelId).sort((a, b) => b.createdAt - a.createdAt);
}

export function addBookmark(bookmark: Bookmark): void {
  const allBookmarks = getAllBookmarksFromStorage();
  // Prevent duplicate bookmarks for the same location
  if (allBookmarks.some(b => b.novelId === bookmark.novelId && b.cfi === bookmark.cfi)) {
    return;
  }
  const updatedBookmarks = [...allBookmarks, bookmark];
  saveAllBookmarksToStorage(updatedBookmarks);
}

export function deleteBookmark(bookmarkId: string): void {
  const allBookmarks = getAllBookmarksFromStorage();
  const updatedBookmarks = allBookmarks.filter(b => b.id !== bookmarkId);
  saveAllBookmarksToStorage(updatedBookmarks);
}
