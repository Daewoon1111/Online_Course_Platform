import { Component, useState } from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { useApp } from '../store';

export const Loading = () => (
    <div className="text-center py-5"><Spinner animation="border" variant="info" role="status" /></div>
);

// Renders loading / error / children(data) for a useApi() state
export function Status({ state, empty = 'Nothing here yet.', children }) {
    const { t } = useApp();
    if (state.error) return <Alert variant="warning">{state.error.message}</Alert>;
    if (!state.data) return <Loading />;
    return Array.isArray(state.data) && !state.data.length
        ? <p className="text-body-secondary">{typeof empty === 'string' ? t(empty) : empty}</p>
        : children(state.data);
}

export const SectionTitle = ({ id, children, action }) => (
    <div id={id} className="d-flex justify-content-between align-items-center mb-4 pt-5 section-title">
        <h2 className="fw-black m-0">{children}</h2>
        {action}
    </div>
);

export const Banner = ({ title, text, children }) => (
    <header className="hero text-center py-5 px-3">
        <h1 className="fw-black">{title}</h1>
        {text && <p className="lead fw-bold text-body-secondary mb-0">{text}</p>}
        {children}
    </header>
);

export const Page = ({ children }) => <main className="page-bg"><Container className="py-5">{children}</Container></main>;

// Keeps a crash in one page from blanking the whole app
export class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) { return { error }; }
    render() {
        const { t } = this.props;
        return this.state.error ? (
            <Container className="py-5">
                <Alert variant="danger" className="d-flex justify-content-between align-items-center gap-3">
                    {t('Something went wrong on this page.')}
                    <Button variant="outline-danger" onClick={() => window.location.reload()}>{t('Reload')}</Button>
                </Alert>
            </Container>
        ) : this.props.children;
    }
}

// Form submit helper: runs fn(formData), shows returned text or error; returns [onSubmit, message, busy]
export function useSubmit(fn) {
    const [state, setState] = useState({});
    const onSubmit = async e => {
        e.preventDefault();
        const form = e.currentTarget;
        setState({ busy: true });
        try {
            const text = await fn(Object.fromEntries(new FormData(form)));
            form.reset?.();
            setState({ text });
        } catch (err) {
            setState({ error: err.message });
        }
    };
    const message = (state.text || state.error) && (
        <Alert variant={state.error ? 'danger' : 'success'} className="mt-3 mb-0 py-2">{state.error || state.text}</Alert>
    );
    return [onSubmit, message, state.busy];
}
