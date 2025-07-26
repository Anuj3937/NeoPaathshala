// storage.js
import { openDB } from 'idb';

const DB_NAME = 'EduContentDB';
const STORE_NAME = 'SavedContent';

export const getDb = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });  // id = grade-type
      }
    },
  });
};

export const saveContent = async (grade, type, topic, content) => {
  const db = await getDb();
  const id = `${grade}_${type}_${topic}`;
  await db.put(STORE_NAME, { id, grade, type, topic, content, savedAt: Date.now() });
};

export const getAllSavedContent = async () => {
  const db = await getDb();
  return await db.getAll(STORE_NAME);
};

export const getSavedContentById = async (id) => {
  const db = await getDb();
  return await db.get(STORE_NAME, id);
};

export const deleteSavedContent = async (id) => {
  const db = await getDb();
  return await db.delete(STORE_NAME, id);
};