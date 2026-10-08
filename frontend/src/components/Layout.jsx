import { useEffect, useState } from 'react';
import { Badge, Button, Offcanvas } from 'react-bootstrap';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { store } from '../api';
import logo from '../assets/logo.png';
import logoIcon from '../assets/logo-icon.png';
import { useApp } from '../store';
import ChatWidget from './ChatWidget';
import SearchBox from './SearchBox';
import { ErrorBoundary } from './ui';

const NAV = [['/', 'Home', 'bi-house'], ['/courses', 'Courses', 'bi-mortarboard'], ['/podcasts', 'Podcasts', 'bi-mic'],
    ['/articles', 'Articles', 'bi-newspaper'], ['/about', 'About Us', 'bi-info-circle']];
const SOCIAL = ['facebook', 'twitter-x', 'instagram', 'linkedin'];
const isDesktop = () => window.matchMedia('(min-width: 992px)').matches;

// Scroll to #hash after navigation (waits up to 3 s for the target to render after data loads), else to top
function useScrollToHash() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (!hash) { window.scrollTo(0, 0); return undefined; }
        let timer, tries = 0;
        const find = () => {
            const el = document.getElementById(decodeURIComponent(hash.slice(1)));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else if (tries++ < 30) timer = setTimeout(find, 100);
        };
        find();
        return () => clearTimeout(timer);
    }, [pathname, hash]);
}

const SideNav = ({ t, onClick }) => NAV.map(([to, text, icon]) => (
    <NavLink key={to} to={to} end={to === '/'} onClick={onClick} className="side-btn" title={t(text)}>
        <i className={`bi ${icon}`} /><span>{t(text)}</span>
    </NavLink>
));

export default function Layout({ children }) {
    const { cart, user, t, lang, toggleLang, theme, toggleTheme } = useApp();
    const [collapsed, setCollapsed] = useState(() => store.get('sidebarCollapsed') ?? false);
    const [menu, setMenu] = useState(false); // slide-in sidebar on small screens
    const { pathname } = useLocation();
    useScrollToHash();
    useEffect(() => { store.set('sidebarCollapsed', collapsed); }, [collapsed]);

    const toggleSidebar = () => (isDesktop() ? setCollapsed(c => !c) : setMenu(true));

    return (
        <>
            <header className="topbar sticky-top shadow-sm">
                <div className="header-row px-3 py-2">
                    <div className="header-left">
                        <Button className="icon-btn" onClick={toggleSidebar} title={t('Menu')} aria-label={t('Menu')}><i className="bi bi-list" /></Button>
                        <Link to="/" title={t('Home')}><img src={logo} alt="Economic Communication Center" height="40" /></Link>
                    </div>
                    {pathname !== '/' && <div className="header-center"><SearchBox className="topbar-search" /></div>}
                    <div className="d-flex align-items-center gap-2 header-tools">
                        <Button className="icon-btn lang-btn" onClick={toggleLang} title={lang === 'en' ? 'Tiếng Việt' : 'English'}>
                            {lang === 'en' ? 'VI' : 'EN'}
                        </Button>
                        <Button className="icon-btn" onClick={toggleTheme} title={t(theme === 'dark' ? 'Light mode' : 'Dark mode')}>
                            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} />
                        </Button>
                        <Link to="/cart" className="icon-btn position-relative" title={t('Cart')}>
                            <i className="bi bi-basket" />
                            {!!cart.length && <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">{cart.length}</Badge>}
                        </Link>
                        <Link to="/account" className="icon-btn" title={user ? user.username : t('Login')}>
                            <i className={`bi ${user ? 'bi-person-check' : 'bi-person'}`} />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="d-flex">
                {/* Left sidebar on large screens: expanded = icon + label in a row, collapsed = icon with small label below */}
                <aside className={`sidebar d-none d-lg-flex ${collapsed ? 'collapsed' : ''}`}>
                    <SideNav t={t} />
                </aside>
                <Offcanvas show={menu} onHide={() => setMenu(false)} placement="start" className="sidebar-panel">
                    <Offcanvas.Header closeButton>
                        <Link to="/" onClick={() => setMenu(false)}><img src={logo} alt="Economic Communication Center" height="40" /></Link>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="d-flex flex-column gap-2">
                        <SideNav t={t} onClick={() => setMenu(false)} />
                    </Offcanvas.Body>
                </Offcanvas>

                <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, minHeight: 'calc(100vh - 57px)' }}>
                    <ErrorBoundary key={pathname} t={t}><div className="flex-grow-1 page-fill">{children}</div></ErrorBoundary>
                    <footer className="site-footer d-flex align-items-center justify-content-center flex-wrap gap-3 py-4 px-3">
                        <Link to="/" className="social-btn p-0" title={t('Home')}><img src={logoIcon} alt="Economic Communication Center" /></Link>
                        <span className="small">&copy; {new Date().getFullYear()} Economic Communication Center.</span>
                        <div className="d-flex gap-2">
                            {SOCIAL.map(s => <a key={s} href="#" className="social-btn" aria-label={s}><i className={`bi bi-${s}`} /></a>)}
                        </div>
                    </footer>
                </div>
            </div>

            <ChatWidget />
        </>
    );
}
