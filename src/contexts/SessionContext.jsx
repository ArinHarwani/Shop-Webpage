import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as DS from '../services/DataService';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('dm_current_session'));
  const [shortlist, setShortlist] = useState([]);
  const [shortlistCount, setShortlistCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const activityTimer = useRef(null);
  const expiryChecker = useRef(null);

  // Load shortlist when session exists
  const refreshShortlist = useCallback(() => {
    if (sessionId) {
      const list = DS.getShortlist(sessionId);
      setShortlist(list);
      setShortlistCount(list.length);
    } else {
      setShortlist([]);
      setShortlistCount(0);
    }
  }, [sessionId]);

  useEffect(() => {
    refreshShortlist();
    const unsub = DS.subscribe('shortlist_items', refreshShortlist);
    return unsub;
  }, [refreshShortlist]);

  // Track activity
  const trackActivity = useCallback(() => {
    if (sessionId) {
      DS.updateSessionActivity(sessionId);
    }
  }, [sessionId]);

  // Activity tracking on user interaction
  useEffect(() => {
    if (!sessionId) return;
    const events = ['click', 'touchstart', 'scroll'];
    const handler = () => {
      if (activityTimer.current) clearTimeout(activityTimer.current);
      activityTimer.current = setTimeout(trackActivity, 1000); // debounce
    };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (activityTimer.current) clearTimeout(activityTimer.current);
    };
  }, [sessionId, trackActivity]);

  // Check session expiry every 30 seconds
  useEffect(() => {
    if (!sessionId) return;
    const customerPaths = ['/', '/catalog', '/item', '/shortlist', '/size-guide'];
    const isCustomerPage = customerPaths.some(p => location.pathname === p || location.pathname.startsWith('/item/'));
    if (!isCustomerPage) return;

    const check = () => {
      const session = DS.getSession(sessionId);
      if (!session) return;
      const diff = Date.now() - new Date(session.last_active_at).getTime();
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      if (diff >= TWO_HOURS) {
        DS.expireSession(sessionId);
        localStorage.removeItem('dm_current_session');
        setSessionId(null);
        navigate('/expired');
      }
    };

    expiryChecker.current = setInterval(check, 30000);
    return () => clearInterval(expiryChecker.current);
  }, [sessionId, navigate, location.pathname]);

  const startSession = useCallback((customerName = '') => {
    const settings = DS.getSettings();
    const session = DS.createSession(customerName, settings.deviceLabel || 'Tablet 1');
    localStorage.setItem('dm_current_session', session.id);
    setSessionId(session.id);
    return session;
  }, []);

  const endSession = useCallback(() => {
    if (sessionId) {
      DS.expireSession(sessionId);
    }
    localStorage.removeItem('dm_current_session');
    setSessionId(null);
    setShortlist([]);
    setShortlistCount(0);
  }, [sessionId]);

  const addToShortlist = useCallback((itemId, variantId) => {
    if (!sessionId) return null;
    trackActivity();
    const result = DS.addToShortlist(sessionId, itemId, variantId);
    refreshShortlist();
    return result;
  }, [sessionId, trackActivity, refreshShortlist]);

  const removeFromShortlist = useCallback((entryId) => {
    trackActivity();
    DS.removeFromShortlist(entryId);
    refreshShortlist();
  }, [trackActivity, refreshShortlist]);

  const isInShortlist = useCallback((variantId) => {
    return shortlist.some(s => s.variant_id === variantId);
  }, [shortlist]);

  return (
    <SessionContext.Provider value={{
      sessionId,
      shortlist,
      shortlistCount,
      startSession,
      endSession,
      addToShortlist,
      removeFromShortlist,
      isInShortlist,
      refreshShortlist,
      trackActivity,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
