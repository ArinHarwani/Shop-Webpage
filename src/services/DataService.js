import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client ─────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Supabase credentials not found in .env. Falling back to local storage only.");
}

// ─── Event bus for reactive updates ──────────────────────────────────
const bus = new EventTarget();

function emit(table) {
  bus.dispatchEvent(new CustomEvent('change', { detail: { table } }));
}

// ─── localStorage helpers ────────────────────────────────────────────
function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(`dm_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(`dm_${key}`, JSON.stringify(data));
}

// ─── Supabase Sync Helpers ───────────────────────────────────────────
let isSyncing = false;
export async function syncWithSupabase() {
  if (!supabase || isSyncing) return;
  isSyncing = true;
  try {
    // Fetch each table individually so one missing table doesn't break everything
    const fetchTable = async (table) => {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error) { console.warn(`Table "${table}" not found or error:`, error.message); return null; }
        return data;
      } catch (e) { console.warn(`Failed to fetch ${table}:`, e); return null; }
    };

    const [items, variants, sessions, shortlists, settings, collections] = await Promise.all([
      fetchTable('items'),
      fetchTable('item_variants'),
      fetchTable('customer_sessions'),
      fetchTable('shortlist_entries'),
      fetchTable('settings'),
      fetchTable('collections'),
    ]);

    if (items) save('items', items);
    if (variants) save('item_variants', variants);
    if (sessions) save('customer_sessions', sessions);
    if (shortlists) save('shortlist_items', shortlists);
    if (collections) save('collections', collections);
    
    if (settings) {
      const settingsObj = {};
      settings.forEach(s => settingsObj[s.id] = s.value);
      if (Object.keys(settingsObj).length > 0) save('settings', settingsObj);
    }

    emit('items');
    emit('item_variants');
    emit('customer_sessions');
    emit('shortlist_items');
    emit('settings');
    emit('collections');

    // Subscribe to realtime changes
    supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
        syncTable('items', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_variants' }, payload => {
        syncTable('item_variants', payload);
        emit('items'); // Re-evaluate allSold etc.
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_sessions' }, payload => {
        syncTable('customer_sessions', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shortlist_entries' }, payload => {
        syncTable('shortlist_items', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, payload => {
        syncTable('collections', payload);
      })
      .subscribe();
      
  } catch (err) {
    console.error("Failed to sync with Supabase:", err);
  } finally {
    isSyncing = false;
  }
}

function syncTable(table, payload) {
  let data = load(table);
  if (payload.eventType === 'INSERT') {
    const exists = data.find(d => d.id === payload.new.id);
    if (!exists) data.push(payload.new);
  } else if (payload.eventType === 'UPDATE') {
    const idx = data.findIndex(d => d.id === payload.new.id);
    if (idx !== -1) data[idx] = payload.new;
    else data.push(payload.new);
  } else if (payload.eventType === 'DELETE') {
    data = data.filter(d => d.id !== payload.old.id);
  }
  save(table, data);
  emit(table);
}

// ─── Init seed data if empty ─────────────────────────────────────────
export async function initSeedDataIfEmpty(seedItems, seedVariants) {
  if (supabase) {
    await syncWithSupabase();
  }
  if (load('items').length === 0) {
    save('items', seedItems);
    save('item_variants', seedVariants);
    if (supabase) {
      seedItems.forEach(async item => {
        await supabase.from('items').upsert(item);
      });
      seedVariants.forEach(async variant => {
        await supabase.from('item_variants').upsert(variant);
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════
//  ITEM CODES (e.g. DM-001, reusable if item deleted)
// ═════════════════════════════════════════════════════════════════════
function generateItemCode() {
  const items = load('items');
  const activeItems = items.filter(i => !i.is_deleted);
  const usedCodes = new Set(activeItems.map(i => i.item_code).filter(Boolean));
  
  for (let n = 1; n <= 9999; n++) {
    const code = `DM-${String(n).padStart(3, '0')}`;
    if (!usedCodes.has(code)) return code;
  }
  return `DM-${uuidv4().slice(0, 6).toUpperCase()}`;
}

export function getItemByCode(code) {
  const items = load('items').filter(i => !i.is_deleted);
  const item = items.find(i => i.item_code && i.item_code.toUpperCase() === code.toUpperCase());
  if (!item) return null;
  return getItemById(item.id);
}

// ═════════════════════════════════════════════════════════════════════
//  COLLECTIONS (custom folders/categories)
// ═════════════════════════════════════════════════════════════════════
export function getCollections() {
  return load('collections', []);
}

export async function addCollection(name) {
  const collections = load('collections', []);
  const trimmed = name.trim();
  if (!trimmed || collections.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return null;
  const entry = { id: uuidv4(), name: trimmed, created_at: new Date().toISOString() };
  collections.push(entry);
  save('collections', collections);
  if (supabase) await supabase.from('collections').insert(entry);
  emit('collections');
  return entry;
}

export async function deleteCollection(id) {
  let collections = load('collections', []);
  collections = collections.filter(c => c.id !== id);
  save('collections', collections);
  if (supabase) await supabase.from('collections').delete().eq('id', id);
  emit('collections');
}

// ═════════════════════════════════════════════════════════════════════
//  ITEMS
// ═════════════════════════════════════════════════════════════════════
export function getItems(filters = {}) {
  let items = load('items').filter(i => !i.is_deleted);
  const variants = load('item_variants');

  if (filters.type && filters.type !== 'All') {
    items = items.filter(i => i.type === filters.type);
  }
  if (filters.occasion && filters.occasion !== 'All') {
    items = items.filter(i => i.occasions && i.occasions.includes(filters.occasion));
  }
  if (filters.collection && filters.collection !== 'All') {
    items = items.filter(i => i.collections && i.collections.includes(filters.collection));
  }
  if (filters.sizes && filters.sizes.length > 0) {
    items = items.filter(i => {
      const iv = variants.filter(v => v.item_id === i.id && v.status === 'available');
      return filters.sizes.some(s => iv.some(v => v.size === s));
    });
  }
  if (filters.colours && filters.colours.length > 0) {
    items = items.filter(i => {
      const iv = variants.filter(v => v.item_id === i.id);
      return filters.colours.some(c => iv.some(v => v.colour_hex.toLowerCase() === c.toLowerCase()));
    });
  }

  // Attach variant summaries
  return items.map(item => {
    const iv = variants.filter(v => v.item_id === item.id);
    const allSold = iv.length > 0 && iv.every(v => v.status === 'sold');
    const colours = [...new Map(iv.map(v => [v.colour_hex, { name: v.colour_name, hex: v.colour_hex, image_url: v.image_url }])).values()];
    const sizes = [...new Set(iv.map(v => v.size))];
    const isNew = item.is_new_arrival && daysSince(item.created_at) <= 7;
    return { ...item, variants: iv, allSold, colours, sizes, isNew };
  });
}

export function getItemById(id) {
  const items = load('items');
  const item = items.find(i => i.id === id);
  if (!item) return null;
  const variants = load('item_variants').filter(v => v.item_id === id);
  const allSold = variants.length > 0 && variants.every(v => v.status === 'sold');
  const colours = [...new Map(variants.map(v => [v.colour_hex, { name: v.colour_name, hex: v.colour_hex, image_url: v.image_url }])).values()];
  const sizes = [...new Set(variants.map(v => v.size))];
  const isNew = item.is_new_arrival && daysSince(item.created_at) <= 7;
  return { ...item, variants, allSold, colours, sizes, isNew };
}

export async function addItem(data) {
  const items = load('items');
  const variants = load('item_variants');
  const id = uuidv4();
  const now = new Date().toISOString();
  const itemCode = generateItemCode();
  const priceVal = data.price ? parseFloat(data.price) : null;
  const item = {
    id,
    item_code: itemCode,
    name: data.name,
    type: data.type,
    occasions: data.occasions,
    collections: data.collections || [],
    price: priceVal,
    fabric: data.fabric || '',
    is_new_arrival: true,
    is_deleted: false,
    godown_number: data.godown_number || '',
    rack_number: data.rack_number || '',
    shelf: data.shelf || '',
    internal_notes: data.internal_notes || '',
    created_at: now,
    updated_at: now,
  };
  items.push(item);
  save('items', items);
  if (supabase) await supabase.from('items').insert(item);

  const newVariants = [];
  // Create variants from colours × sizes
  if (data.colourSizeVariants && data.colourSizeVariants.length > 0) {
    data.colourSizeVariants.forEach(v => {
      newVariants.push({
        id: uuidv4(),
        item_id: id,
        colour_name: v.colour_name,
        colour_hex: v.colour_hex,
        size: v.size,
        image_url: v.image_url || `https://picsum.photos/seed/${id}-${v.colour_name}/400/500`,
        status: 'available',
        sold_at: null,
      });
    });
  }
  variants.push(...newVariants);
  save('item_variants', variants);
  if (supabase && newVariants.length > 0) await supabase.from('item_variants').insert(newVariants);
  
  emit('items');
  return item;
}

export async function updateItem(id, data) {
  const items = load('items');
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  const updated = { ...items[idx], ...data, updated_at: new Date().toISOString() };
  items[idx] = updated;
  save('items', items);
  if (supabase) await supabase.from('items').update(updated).eq('id', id);
  emit('items');
  return items[idx];
}

export async function deleteItem(id) {
  return updateItem(id, { is_deleted: true });
}

// ═════════════════════════════════════════════════════════════════════
//  VARIANTS
// ═════════════════════════════════════════════════════════════════════
export function getVariants(itemId) {
  return load('item_variants').filter(v => v.item_id === itemId);
}

export async function updateVariantStatus(variantId, status) {
  const variants = load('item_variants');
  const idx = variants.findIndex(v => v.id === variantId);
  if (idx === -1) return null;
  
  const updated = { ...variants[idx], status, sold_at: status === 'sold' ? new Date().toISOString() : null };
  variants[idx] = updated;
  save('item_variants', variants);
  if (supabase) await supabase.from('item_variants').update({ status: updated.status, sold_at: updated.sold_at }).eq('id', variantId);
  
  emit('item_variants');
  emit('items');
  return variants[idx];
}

// ═════════════════════════════════════════════════════════════════════
//  SESSIONS
// ═════════════════════════════════════════════════════════════════════
export async function createSession(customerName = '', deviceLabel = 'Tablet 1') {
  const sessions = load('customer_sessions');
  const now = new Date().toISOString();
  const session = {
    id: uuidv4(),
    customer_name: customerName,
    device_label: deviceLabel,
    started_at: now,
    last_active_at: now,
    is_expired: false,
  };
  sessions.push(session);
  save('customer_sessions', sessions);
  if (supabase) await supabase.from('customer_sessions').insert(session);
  emit('customer_sessions');
  return session;
}

export function getSession(id) {
  return load('customer_sessions').find(s => s.id === id) || null;
}

export async function updateSessionActivity(id) {
  const sessions = load('customer_sessions');
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;
  
  const updated = { ...sessions[idx], last_active_at: new Date().toISOString(), is_expired: false };
  sessions[idx] = updated;
  save('customer_sessions', sessions);
  if (supabase) await supabase.from('customer_sessions').update({ last_active_at: updated.last_active_at, is_expired: false }).eq('id', id);
  return sessions[idx];
}

export async function expireSession(id) {
  const sessions = load('customer_sessions');
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return;
  
  sessions[idx].is_expired = true;
  save('customer_sessions', sessions);
  if (supabase) await supabase.from('customer_sessions').update({ is_expired: true }).eq('id', id);
  emit('customer_sessions');
}

export function getActiveSessions() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  return load('customer_sessions').filter(
    s => !s.is_expired && s.last_active_at > twoHoursAgo
  );
}

export function getAllSessions() {
  return load('customer_sessions');
}

// ═════════════════════════════════════════════════════════════════════
//  SHORTLIST
// ═════════════════════════════════════════════════════════════════════
export async function addToShortlist(sessionId, itemId, variantId) {
  const list = load('shortlist_items');
  // Check for duplicates
  if (list.some(s => s.session_id === sessionId && s.variant_id === variantId)) {
    return null;
  }
  // Max 20
  const sessionList = list.filter(s => s.session_id === sessionId);
  if (sessionList.length >= 20) return null;

  const entry = {
    id: uuidv4(),
    session_id: sessionId,
    item_id: itemId,
    variant_id: variantId,
    added_at: new Date().toISOString(),
  };
  list.push(entry);
  save('shortlist_items', list);
  if (supabase) await supabase.from('shortlist_entries').insert(entry);
  emit('shortlist_items');
  return entry;
}

export async function removeFromShortlist(id) {
  let list = load('shortlist_items');
  list = list.filter(s => s.id !== id);
  save('shortlist_items', list);
  if (supabase) await supabase.from('shortlist_entries').delete().eq('id', id);
  emit('shortlist_items');
}

export function getShortlist(sessionId) {
  const list = load('shortlist_items').filter(s => s.session_id === sessionId);
  const items = load('items');
  const variants = load('item_variants');
  return list.map(entry => {
    const item = items.find(i => i.id === entry.item_id);
    const variant = variants.find(v => v.id === entry.variant_id);
    return { ...entry, item, variant };
  }).filter(e => e.item && e.variant);
}

export function getAllShortlists() {
  return load('shortlist_items');
}

export function getShortlistCount(sessionId) {
  return load('shortlist_items').filter(s => s.session_id === sessionId).length;
}

// ═════════════════════════════════════════════════════════════════════
//  SIMILAR ITEMS
// ═════════════════════════════════════════════════════════════════════
export function getSimilarItems(itemId, limit = 6) {
  const item = getItemById(itemId);
  if (!item) return [];
  return getItems()
    .filter(i => i.id !== itemId && i.type === item.type && !i.allSold)
    .filter(i => i.occasions && item.occasions && i.occasions.some(o => item.occasions.includes(o)))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

// ═════════════════════════════════════════════════════════════════════
//  DASHBOARD METRICS
// ═════════════════════════════════════════════════════════════════════
export function getDashboardMetrics() {
  const items = load('items').filter(i => !i.is_deleted);
  const variants = load('item_variants');
  const sessions = load('customer_sessions');
  const shortlists = load('shortlist_items');
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

  const totalActive = items.filter(i => {
    const iv = variants.filter(v => v.item_id === i.id);
    return iv.some(v => v.status === 'available');
  }).length;

  const soldToday = variants.filter(v => v.status === 'sold' && v.sold_at && v.sold_at >= todayStart).length;

  const pendingRemoval = items.filter(i => {
    const iv = variants.filter(v => v.item_id === i.id);
    return iv.length > 0 && iv.every(v => v.status === 'sold');
  }).length;

  const activeSessions = sessions.filter(
    s => !s.is_expired && s.last_active_at > twoHoursAgo
  ).length;

  // Most shortlisted today
  const todayShortlists = shortlists.filter(s => s.added_at >= todayStart);
  const itemCounts = {};
  todayShortlists.forEach(s => {
    itemCounts[s.item_id] = (itemCounts[s.item_id] || 0) + 1;
  });
  const mostShortlisted = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([itemId, count]) => {
      const item = items.find(i => i.id === itemId);
      return { item, count };
    })
    .filter(e => e.item);

  const newArrivals = items.filter(i => i.created_at >= weekAgo).length;

  return { totalActive, soldToday, pendingRemoval, activeSessions, mostShortlisted, newArrivals };
}

// ═════════════════════════════════════════════════════════════════════
//  AVAILABLE FILTER VALUES
// ═════════════════════════════════════════════════════════════════════
export function getAvailableFilterValues() {
  const items = load('items').filter(i => !i.is_deleted);
  const variants = load('item_variants');

  const types = [...new Set(items.map(i => i.type))];
  const occasions = [...new Set(items.flatMap(i => i.occasions || []))];
  const sizes = [...new Set(variants.filter(v => v.status === 'available').map(v => v.size))];
  const colours = [...new Map(
    variants.map(v => [v.colour_hex, { name: v.colour_name, hex: v.colour_hex }])
  ).values()];
  const collections = getCollections();

  return { types, occasions, sizes, colours, collections };
}

// ═════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═════════════════════════════════════════════════════════════════════
export function getSettings() {
  return load('settings', {
    shopName: 'DressMirror',
    deviceLabel: 'Tablet 1',
    adminPassword: 'admin123',
  });
}

export async function updateSettings(data) {
  const settings = getSettings();
  const updated = { ...settings, ...data };
  save('settings', updated);
  
  if (supabase) {
    for (const [key, value] of Object.entries(updated)) {
      await supabase.from('settings').upsert({ id: key, value });
    }
  }
  emit('settings');
  return updated;
}

// ═════════════════════════════════════════════════════════════════════
//  SUBSCRIBE (reactive updates)
// ═════════════════════════════════════════════════════════════════════
export function subscribe(table, callback) {
  const handler = (e) => {
    if (!table || e.detail.table === table) {
      callback(e.detail);
    }
  };
  bus.addEventListener('change', handler);
  return () => bus.removeEventListener('change', handler);
}

// ═════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════
function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// Size guide data
export function getSizeGuideData() {
  const custom = load('size_guide', null);
  if (custom) return custom;
  return {
    'Top': {
      headers: ['Size', 'Chest (in)', 'Waist (in)', 'Length (in)'],
      rows: [
        ['XS', '32–34', '26–28', '24'],
        ['S', '34–36', '28–30', '25'],
        ['M', '36–38', '30–32', '26'],
        ['L', '38–40', '32–34', '27'],
        ['XL', '40–42', '34–36', '28'],
        ['XXL', '42–44', '36–38', '29'],
      ],
    },
    'Bottom': {
      headers: ['Size', 'Waist (in)', 'Hip (in)', 'Length (in)'],
      rows: [
        ['XS', '26–28', '34–36', '38'],
        ['S', '28–30', '36–38', '39'],
        ['M', '30–32', '38–40', '40'],
        ['L', '32–34', '40–42', '41'],
        ['XL', '34–36', '42–44', '42'],
        ['XXL', '36–38', '44–46', '43'],
      ],
    },
    'Long Dress': {
      headers: ['Size', 'Bust (in)', 'Waist (in)', 'Hip (in)', 'Length (in)'],
      rows: [
        ['XS', '32–34', '26–28', '34–36', '50'],
        ['S', '34–36', '28–30', '36–38', '51'],
        ['M', '36–38', '30–32', '38–40', '52'],
        ['L', '38–40', '32–34', '40–42', '53'],
        ['XL', '40–42', '34–36', '42–44', '54'],
        ['XXL', '42–44', '36–38', '44–46', '55'],
      ],
    },
    'Kurti': {
      headers: ['Size', 'Bust (in)', 'Waist (in)', 'Length (in)'],
      rows: [
        ['XS', '32–34', '26–28', '38'],
        ['S', '34–36', '28–30', '40'],
        ['M', '36–38', '30–32', '42'],
        ['L', '38–40', '32–34', '44'],
        ['XL', '40–42', '34–36', '46'],
        ['XXL', '42–44', '36–38', '48'],
      ],
    },
    'Shorts': {
      headers: ['Size', 'Waist (in)', 'Hip (in)', 'Length (in)'],
      rows: [
        ['XS', '26–28', '34–36', '14'],
        ['S', '28–30', '36–38', '15'],
        ['M', '30–32', '38–40', '16'],
        ['L', '32–34', '40–42', '17'],
        ['XL', '34–36', '42–44', '18'],
        ['XXL', '36–38', '44–46', '19'],
      ],
    },
    'Coord Set': {
      headers: ['Size', 'Bust (in)', 'Waist (in)', 'Hip (in)'],
      rows: [
        ['XS', '32–34', '26–28', '34–36'],
        ['S', '34–36', '28–30', '36–38'],
        ['M', '36–38', '30–32', '38–40'],
        ['L', '38–40', '32–34', '40–42'],
        ['XL', '40–42', '34–36', '42–44'],
        ['XXL', '42–44', '36–38', '44–46'],
      ],
    },
  };
}

export function updateSizeGuide(data) {
  save('size_guide', data);
  emit('settings');
}

// ═════════════════════════════════════════════════════════════════════
//  STORAGE (Images)
// ═════════════════════════════════════════════════════════════════════
export async function uploadImage(file) {
  if (!supabase) throw new Error("Supabase is not initialized.");
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
  
  // Get public URL
  const { data: publicData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);
    
  return publicData.publicUrl;
}

export function getOptimizedImageUrl(url, width = 400, quality = 80) {
  if (!url || !url.includes('supabase.co')) return url; // Only transform Supabase URLs
  
  // Supabase image transformations use query params on the public URL
  // e.g. https://.../product-images/abc.jpg?width=400&quality=60
  const urlObj = new URL(url);
  urlObj.searchParams.set('width', width);
  urlObj.searchParams.set('quality', quality);
  // Optional: urlObj.searchParams.set('resize', 'contain');
  return urlObj.toString();
}
