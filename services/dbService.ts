import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { Novel } from '../types';

const DB_NAME = 'GeminiNovelReaderDB';
const STORE_NAME = 'novels';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveNovel(novel: Novel): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, novel);
}

export async function getAllNovels(): Promise<Novel[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function getNovelById(id: string): Promise<Novel | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, id);
}

export async function deleteNovel(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}