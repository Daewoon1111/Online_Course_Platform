import { useEffect, useState } from 'react';
import { Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../store';

export const RESULT = {
    course: { icon: 'bi-mortarboard', label: 'Course', link: r => `/courses/${r.slug}` },
    podcast: { icon: 'bi-mic', label: 'Podcast', link: r => `/podcasts#podcast-${r.slug}` },
    article: { icon: 'bi-newspaper', label: 'Article', link: r => `/articles/${r.slug}` },
};

// Search input with live suggestions (courses, podcasts, articles). Enter opens the full results page.
export default function SearchBox({ size, className = '' }) {
    const { t } = useApp();
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    useEffect(() => {
        const query = q.trim();
        if (query.length < 2) { setItems([]); return undefined; }
        const timer = setTimeout(() => api(`search/?q=${encodeURIComponent(query)}`).then(setItems, () => setItems([])), 250);
        return () => clearTimeout(timer);
    }, [q]);

    const go = to => { setOpen(false); setQ(''); navigate(to); };
    const submit = e => {
        e.preventDefault();
        if (items[active]) go(RESULT[items[active].type].link(items[active]));
        else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    };
    const onKeyDown = e => {
        const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (step) { e.preventDefault(); setActive(i => Math.max(-1, Math.min(items.length - 1, i + step))); }
        if (e.key === 'Escape') setOpen(false);
    };

    return (
        <Form onSubmit={submit} className={`search-box position-relative ${className}`} role="search">
            <InputGroup size={size} className="rounded-pill overflow-hidden shadow-sm">
                <Form.Control value={q} placeholder={t('Search courses, podcasts, articles...')} aria-label={t('Search')}
                    className="border-0 ps-3" autoComplete="off" onKeyDown={onKeyDown}
                    onChange={e => { setQ(e.target.value); setOpen(true); setActive(-1); }}
                    onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
                <Button type="submit" variant="light" aria-label={t('Search')}><i className="bi bi-search" /></Button>
            </InputGroup>
            {open && items.length > 0 && (
                <ListGroup className="search-suggest shadow">
                    {items.map((r, i) => (
                        <ListGroup.Item key={r.type + r.slug} action active={i === active} className="d-flex align-items-center"
                            onMouseDown={e => e.preventDefault()} onClick={() => go(RESULT[r.type].link(r))}>
                            <i className={`bi ${RESULT[r.type].icon} me-2`} />
                            <span className="text-truncate flex-grow-1 text-start">{r.title}</span>
                            <small className="ms-2 opacity-75">{t(RESULT[r.type].label)}</small>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </Form>
    );
}
