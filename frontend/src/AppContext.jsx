import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from './api';

const AppContext = createContext(null);

const initialState = {
  user: null,
  theme: 'light',
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  toast: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, notificationsLoading: false, notificationsError: null };
    case 'SET_NOTIFICATIONS_LOADING':
      return { ...state, notificationsLoading: true, notificationsError: null };
    case 'SET_NOTIFICATIONS_ERROR':
      return { ...state, notificationsLoading: false, notificationsError: action.payload };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const cachedUser = sessionStorage.getItem('sitechat_user');
      const cachedTheme = sessionStorage.getItem('sitechat_theme');
      return {
        ...init,
        user: cachedUser ? JSON.parse(cachedUser) : null,
        theme: cachedTheme || init.theme
      };
    } catch {
      return init;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    sessionStorage.setItem('sitechat_theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (state.user) sessionStorage.setItem('sitechat_user', JSON.stringify(state.user));
    else sessionStorage.removeItem('sitechat_user');
  }, [state.user]);

  const login = useCallback((user) => dispatch({ type: 'LOGIN', payload: user }), []);
  const updateUser = useCallback((updates) => dispatch({ type: 'UPDATE_USER', payload: updates }), []);
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const toggleTheme = useCallback(() => dispatch({ type: 'TOGGLE_THEME' }), []);

  const showToast = useCallback((message, kind = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, kind, id: Date.now() } });
  }, []);

  const clearToast = useCallback(() => dispatch({ type: 'CLEAR_TOAST' }), []);

  const loadNotifications = useCallback(async () => {
    dispatch({ type: 'SET_NOTIFICATIONS_LOADING' });
    try {
      const data = await fetchNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_NOTIFICATIONS_ERROR', payload: err.message || 'Unable to load notifications.' });
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      const data = await fetchNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data });
    } catch (err) {
      showToast(err.message || 'Unable to mark notification as read.', 'error');
    }
  }, [showToast]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      const data = await fetchNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data });
    } catch (err) {
      showToast(err.message || 'Unable to mark notifications as read.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (state.user) loadNotifications();
  }, [state.user, loadNotifications]);

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const value = useMemo(
    () => ({
      ...state,
      unreadCount,
      login,
      updateUser,
      logout,
      toggleTheme,
      showToast,
      clearToast,
      loadNotifications,
      markRead,
      markAllRead
    }),
    [state, unreadCount, login, updateUser, logout, toggleTheme, showToast, clearToast, loadNotifications, markRead, markAllRead]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
