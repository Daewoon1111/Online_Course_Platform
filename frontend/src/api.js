import { useEffect, useState } from 'react';

// localStorage wrapper that never throws (private mode, blocked storage)
export const store = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const errorText = d => d && Object.entries(d)
    .map(([k, v]) => ['detail', 'non_field_errors'].includes(k) ? v : `${k}: ${v}`).join(' ');

// fetch wrapper: JSON in/out, token auth, DRF errors turned into Error(message)
export async function api(path, body, method = body ? 'POST' : 'GET') {
    const token = store.get('token');
    const res = await fetch(`/api/${path}`, {
        method,
        body: body && JSON.stringify(body),
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Token ${token}` }) },
    }).catch(() => { throw new Error('Cannot reach the server. Is the backend running?'); });
    if (res.status === 401 && token) return store.set('token', null), api(path, body, method); // stale token: retry as guest
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error(errorText(data) || `Request failed (${res.status}).`);
    return data;
}

// GET hook: { data } | { error } | { loading }. Change `version` to refetch.
export function useApi(path, version = 0) {
    const [state, setState] = useState({ loading: true });
    useEffect(() => {
        if (!path) return undefined;
        let live = true;
        setState({ loading: true });
        api(path).then(data => live && setState({ data }), error => live && setState({ error }));
        return () => { live = false; };
    }, [path, version]);
    return state;
}

export const money = v => `$${(+v).toFixed(2)}`;
export const hoursOf = min => +(min / 60).toFixed(1);
export const paragraphs = s => (s || '').split(/\n\s*\n/).filter(p => p.trim());
export const hms = s => [s / 3600, s / 60 % 60, s % 60].map(n => String(Math.floor(n)).padStart(2, '0')).join(':');
