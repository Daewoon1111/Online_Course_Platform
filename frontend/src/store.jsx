import { createContext, useContext, useEffect, useState } from 'react';
import { api, store } from './api';
import { VI } from './i18n';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;

// Global state: user (token in localStorage), cart (prices re-checked by the server), language, colour theme.
export function AppProvider({ children }) {
    const [user, setUser] = useState(() => store.get('user'));
    const [cart, setCart] = useState(() => store.get('cart') || []);
    const [lang, setLang] = useState(() => store.get('lang') || 'en');
    const [theme, setTheme] = useState(() => store.get('theme') || (prefersDark() ? 'dark' : 'light'));

    useEffect(() => { if (store.get('token')) api('auth/me/').then(setUser, () => setUser(null)); }, []);
    useEffect(() => { store.set('user', user); }, [user]);
    useEffect(() => { store.set('cart', cart); }, [cart]);
    useEffect(() => { store.set('lang', lang); document.documentElement.lang = lang; }, [lang]);
    useEffect(() => { store.set('theme', theme); document.documentElement.dataset.bsTheme = theme; }, [theme]);

    const value = {
        user,
        login: ({ token, user }) => (store.set('token', token), setUser(user)),
        logout: async () => {
            await api('auth/logout/', {}).catch(() => {});
            store.set('token', null);
            setUser(null);
        },
        cart,
        inCart: id => cart.some(c => c.id === id),
        addToCart: ({ id, slug, title, current_price, thumbnail }) =>
            setCart(cs => cs.some(c => c.id === id) ? cs : [...cs, { id, slug, title, current_price, thumbnail }]),
        removeFromCart: id => setCart(cs => cs.filter(c => c.id !== id)),
        clearCart: () => setCart([]),
        lang,
        toggleLang: () => setLang(l => l === 'en' ? 'vi' : 'en'),
        locale: lang === 'vi' ? 'vi-VN' : 'en-GB',
        t: s => (lang === 'vi' && VI[s]) || s,
        theme,
        toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
