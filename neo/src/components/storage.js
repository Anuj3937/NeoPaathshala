// storage.js
import { openDB } from 'idb';

const DB_NAME = 'EduContentDB';
const SAVED_CONTENT_STORE_NAME = 'SavedContent';
const WEEKLY_PLANNER_STORE_NAME = 'WeeklyPlannerStore'; // New store for the planner

// Bump the version to 2 to trigger the upgrade process
export const getDb = async () => {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      // Store for general saved content
      if (!db.objectStoreNames.contains(SAVED_CONTENT_STORE_NAME)) {
        db.createObjectStore(SAVED_CONTENT_STORE_NAME, { keyPath: 'id' }); // id = grade-type
      }
      // New store for the weekly lesson plans
      if (!db.objectStoreNames.contains(WEEKLY_PLANNER_STORE_NAME)) {
        db.createObjectStore(WEEKLY_PLANNER_STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

// --- Functions for SavedContent Store ---

export const saveContent = async (grade, type, topic, content) => {
  const db = await getDb();
  const id = `${grade}_${type}_${topic}`;
  await db.put(SAVED_CONTENT_STORE_NAME, { id, grade, type, topic, content, savedAt: Date.now() });
};

export const getAllSavedContent = async () => {
  const db = await getDb();
  return await db.getAll(SAVED_CONTENT_STORE_NAME);
};

export const getSavedContentById = async (id) => {
  const db = await getDb();
  return await db.get(SAVED_CONTENT_STORE_NAME, id);
};

export const deleteSavedContent = async (id) => {
  const db = await getDb();
  return await db.delete(SAVED_CONTENT_STORE_NAME, id);
};


// --- NEW: Functions for WeeklyPlannerStore ---

/**
 * Saves the entire array of lesson plans to IndexedDB, replacing any old data.
 * @param {Array} lessons - The array of lesson plan objects to save.
 */
export const saveWeeklyPlan = async (lessons) => {
    const db = await getDb();
    const tx = db.transaction(WEEKLY_PLANNER_STORE_NAME, 'readwrite');
    // Clear old plan data before saving the new one
    await tx.store.clear();
    // Add each new lesson plan to the store
    await Promise.all(lessons.map(lesson => tx.store.put(lesson)));
    return tx.done;
};

/**
 * Retrieves the entire weekly lesson plan from IndexedDB.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson plan objects.
 */
export const getWeeklyPlan = async () => {
    const db = await getDb();
    return await db.getAll(WEEKLY_PLANNER_STORE_NAME);
}