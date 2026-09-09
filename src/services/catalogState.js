const STORAGE_KEY = 'dm_catalog_state';

const DEFAULT_STATE = {
  filters: {
    type: null,
    occasion: 'All',
    collection: 'All',
    sizes: [],
    colours: [],
  },
  viewMode: 'swipe',
  currentIndex: 0,
  lastItemId: null,
  visibleCount: 24,
  scrollY: 0,
};

/**
 * Retrieve the saved catalog browsing state from sessionStorage.
 */
export function getCatalogState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      filters: {
        ...DEFAULT_STATE.filters,
        ...(parsed.filters || {}),
      },
      viewMode: parsed.viewMode === 'grid' ? 'grid' : 'swipe',
      currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
      lastItemId: parsed.lastItemId || null,
      visibleCount: typeof parsed.visibleCount === 'number' ? parsed.visibleCount : 24,
      scrollY: typeof parsed.scrollY === 'number' ? parsed.scrollY : 0,
    };
  } catch (e) {
    console.warn('Failed to read catalog state from sessionStorage:', e);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Merge and save updates to catalog browsing state in sessionStorage.
 */
export function saveCatalogState(updates = {}) {
  try {
    const current = getCatalogState();
    const nextState = {
      ...current,
      ...updates,
      filters: {
        ...current.filters,
        ...(updates.filters || {}),
      },
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
  } catch (e) {
    console.warn('Failed to save catalog state to sessionStorage:', e);
    return null;
  }
}

/**
 * Convenience helper to save current card index and last active item ID.
 */
export function updateCatalogIndex(currentIndex, lastItemId = null) {
  try {
    const current = getCatalogState();
    current.currentIndex = currentIndex;
    if (lastItemId) {
      current.lastItemId = lastItemId;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to update catalog index in sessionStorage:', e);
  }
}

/**
 * Clear the saved catalog browsing state (e.g. on new session or logout).
 */
export function clearCatalogState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear catalog state from sessionStorage:', e);
  }
}
