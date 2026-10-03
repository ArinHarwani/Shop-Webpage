const STORAGE_KEY = 'dm_admin_inventory_state';
const VIEW_PREF_KEY = 'dm_admin_inventory_view_mode';

const DEFAULT_STATE = {
  search: '',
  filterType: 'All',
  filterStatus: 'All',
  sortBy: 'newest',
  viewMode: 'large-grid', // Default to large-grid or table
  lastItemId: null,
  scrollY: 0,
};

/**
 * Retrieve the saved admin inventory browsing state from sessionStorage.
 */
export function getAdminInventoryState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const savedView = localStorage.getItem(VIEW_PREF_KEY);
    const base = raw ? JSON.parse(raw) : {};
    return {
      search: typeof base.search === 'string' ? base.search : DEFAULT_STATE.search,
      filterType: base.filterType || DEFAULT_STATE.filterType,
      filterStatus: base.filterStatus || DEFAULT_STATE.filterStatus,
      sortBy: base.sortBy || DEFAULT_STATE.sortBy,
      viewMode: base.viewMode || savedView || DEFAULT_STATE.viewMode,
      lastItemId: base.lastItemId || null,
      scrollY: typeof base.scrollY === 'number' ? base.scrollY : 0,
    };
  } catch (e) {
    console.warn('Failed to read admin inventory state from sessionStorage:', e);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Merge and save updates to admin inventory state in sessionStorage.
 */
export function saveAdminInventoryState(updates = {}) {
  try {
    const current = getAdminInventoryState();
    const nextState = {
      ...current,
      ...updates,
    };
    if (updates.viewMode) {
      localStorage.setItem(VIEW_PREF_KEY, updates.viewMode);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
  } catch (e) {
    console.warn('Failed to save admin inventory state to sessionStorage:', e);
    return null;
  }
}

/**
 * Reset only the last viewed item ID.
 */
export function clearAdminInventoryLastItem() {
  try {
    const current = getAdminInventoryState();
    current.lastItemId = null;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to clear admin inventory last item:', e);
  }
}
