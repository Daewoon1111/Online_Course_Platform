import { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { useApp } from '../store';

// Minimal markdown for chat replies: **bold** and "- " list lines
const rich = text => text.split('\n').map((line, i) => (
    <div key={i} className={/^\s*[-*] /.test(line) ? 'ps-3' : ''}>
        {/^\s*[-*] /.test(line) && '• '}
        {line.replace(/^\s*[-*] /, '').split(/\*\*(.+?)\*\*/g).map((part, j) => j % 2 ? <strong key={j}>{part}</strong> : part)}
    </div>
));

// Floating course-advisor chat. Only the last 10 turns are sent; the server limits AI calls per user.
export default function ChatWidget() {
    const { t } = useApp();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [busy, setBusy] = useState(false);
    const body = useRef(null);

    // Scroll only the chat box. Braces matter: newer browsers return a Promise from smooth scrolling,
    // and an effect that returns a non-function crashes React (this was the blank-page bug).
    useEffect(() => {
        if (body.current) body.current.scrollTop = body.current.scrollHeight;
    }, [messages, busy, open]);

    const send = async e => {
        e.preventDefault();
        const content = e.currentTarget.message.value.trim();
        if (!content || busy) return;
        e.currentTarget.reset();
        const history = [...messages, { role: 'user', content }];
        setMessages(history);
        setBusy(true);
        try {
            const r = await api('chat/', { messages: history.filter(m => !m.error).slice(-10).map(({ role, content }) => ({ role, content })) });
            setMessages(m => [...m, { role: 'assistant', content: String(r.reply || '…'), courses: r.courses || [] }]);
        } catch (err) {
            setMessages(m => [...m, { role: 'assistant', content: err.message, error: true }]);
        }
        setBusy(false);
    };

    if (!open) return (
        <Button variant="accent" className="chat-fab rounded-pill shadow" onClick={() => setOpen(true)}>
            <i className="bi bi-chat-dots me-2" />{t('Course advisor')}
        </Button>
    );
    return (
        <Card className="chat-panel shadow-lg">
            <Card.Header className="d-flex justify-content-between align-items-center topbar">
                <strong><i className="bi bi-robot me-2" />{t('Course advisor')}</strong>
                <Button variant="link" className="text-body p-0" onClick={() => setOpen(false)} aria-label={t('Close')}><i className="bi bi-x-lg" /></Button>
            </Card.Header>
            <Card.Body ref={body} className="chat-body">
                {[{ role: 'assistant', content: t('Hi! I am the course advisor. Tell me what you want to learn and I will suggest courses.') }, ...messages].map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role} ${m.error ? 'error' : ''}`}>
                        <div className="chat-bubble">{rich(m.content)}</div>
                        {m.courses?.map(c => (
                            <Link key={c.slug} to={`/courses/${c.slug}`} className="chat-course">
                                <i className="bi bi-mortarboard me-1" />{c.title} · {money(c.current_price)}
                            </Link>
                        ))}
                    </div>
                ))}
                {busy && <Spinner size="sm" animation="grow" variant="info" />}
            </Card.Body>
            <Card.Footer>
                <Form onSubmit={send} className="d-flex gap-2">
                    <Form.Control name="message" placeholder={t('Ask about our courses...')} maxLength={1000} autoComplete="off" disabled={busy} />
                    <Button type="submit" variant="accent" disabled={busy} aria-label={t('Send')}><i className="bi bi-send" /></Button>
                </Form>
                <small className="text-body-secondary d-block mt-1">{t('AI answers can be wrong. Prices are checked at checkout.')}</small>
            </Card.Footer>
        </Card>
    );
}
