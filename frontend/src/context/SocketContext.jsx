import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { io as ioClient } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { refreshSession } from '../api';

/*
 * Realtime layer for the frontend.
 *
 * One socket per signed-in session. The server has already put this socket into
 * a room for every group the user belongs to (see backend/src/socket/index.js),
 * so a single "group:activity" event stream covers every group at once — no
 * per-group subscribe/unsubscribe dance needed on the client.
 *
 * Two things consume that stream:
 *  1. Whichever GroupDetail page is open subscribes via onGroupActivity() and
 *     force-refetches its own data so new expenses/settlements appear live.
 *  2. This provider itself tracks an unread-activity count per group (skipping
 *     your own actions and whichever group you're actively looking at), so the
 *     sidebar / groups list can show a WhatsApp-style badge.
 */

const SocketCtx = createContext(null);

const BASE = import.meta.env.VITE_API_BASE_URL || '';
const SOCKET_URL = (() => {
  try { return new URL(BASE).origin; } catch { return BASE; }
})();

const UNREAD_KEY = 'splitly.unread';

function readUnread() {
  try { return JSON.parse(localStorage.getItem(UNREAD_KEY) || '{}'); } catch { return {}; }
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const [connected, setConnected] = useState(false);
  const [unreadByGroup, setUnreadByGroup] = useState(readUnread);

  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());
  const pathRef = useRef(location.pathname);

  useEffect(() => { pathRef.current = location.pathname; }, [location.pathname]);

  useEffect(() => {
    try { localStorage.setItem(UNREAD_KEY, JSON.stringify(unreadByGroup)); } catch { /* ignore */ }
  }, [unreadByGroup]);

  const markGroupRead = useCallback((groupId) => {
    if (!groupId) return;
    setUnreadByGroup(prev => {
      if (!prev[groupId]) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  }, []);

  // If the tab regains focus while a group page is open, clear that group's badge —
  // any activity that happened while the tab was backgrounded no longer counts as unread.
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      const m = pathRef.current.match(/^\/groups\/([^/]+)/);
      if (m) markGroupRead(m[1]);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [markGroupRead]);

  // Open/close the socket as the session comes and goes.
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return undefined;
    }

    const socket = ioClient(SOCKET_URL, {
      // Function form so a refreshed token is read fresh on every (re)connect attempt.
      auth: (cb) => cb({ token: localStorage.getItem('accessToken') }),
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // The socket handshake uses the access token too. If it expired while the app
    // was idle the server rejects it and socket.io does NOT retry on its own, so
    // renew the token and reconnect once (reset on every successful connect).
    let retriedAuth = false;
    socket.on('connect', () => { retriedAuth = false; setConnected(true); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', async (err) => {
      if (err?.message !== 'Unauthorized' || retriedAuth) return;
      retriedAuth = true;
      try {
        await refreshSession();
        socket.connect();
      } catch { /* transient — will retry on next focus/reconnect */ }
    });

    socket.on('group:activity', (evt) => {
      // 1) Forward to whichever GroupDetail page (if any) is listening for this group.
      listenersRef.current.forEach(fn => fn(evt));

      // 2) Unread-badge bookkeeping.
      if (!evt?.groupId) return;
      if (evt.actorId && user?._id && evt.actorId === user._id) return; // never badge your own action

      const viewingThisGroup = pathRef.current === `/groups/${evt.groupId}` && !document.hidden;
      if (viewingThisGroup) return;

      setUnreadByGroup(prev => ({ ...prev, [evt.groupId]: (prev[evt.groupId] || 0) + 1 }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Subscribe to the raw activity stream (used by GroupDetail). Returns an unsubscribe fn.
  const onGroupActivity = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const totalUnread = Object.values(unreadByGroup).reduce((s, n) => s + n, 0);

  const value = {
    socket: socketRef.current,
    connected,
    unreadByGroup,
    totalUnread,
    markGroupRead,
    onGroupActivity,
  };

  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketCtx);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}