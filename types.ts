export interface TOCItem {
  id: string;
  href: string;
  label: string;
  subitems?: TOCItem[];
}

export interface Novel {
  id: string;
  title: string; // e.g., "Volume 01"
  bookTitle: string; // e.g., "Knight's & Magic"
  epubPath: string;
  pdfPath?: string;
  // --- Lazily loaded properties ---
  author?: string;
  coverUrl?: string | null;
  toc?: TOCItem[];
  file?: ArrayBuffer;
}

export interface Character {
  name: string;
  description: string;
}

export interface Place {
  name: string;
  description: string;
}

export interface SearchResult {
  quote: string;
  context: string;
}

export interface Bookmark {
  id: string;
  novelId: string;
  cfi: string;
  label: string;
  createdAt: number;
}