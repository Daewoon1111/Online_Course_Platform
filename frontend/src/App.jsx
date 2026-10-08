import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Loading } from './components/ui';

// Each page is a separate chunk, loaded on first visit
const Home = lazy(() => import('./pages/Home'));
const list = name => lazy(() => import('./pages/ListPages').then(m => ({ default: m[name] })));
const Courses = list('Courses');
const Podcasts = list('Podcasts');
const Articles = list('Articles');
const Search = lazy(() => import('./pages/Search'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Account = lazy(() => import('./pages/Account'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
    return (
        <Layout>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:slug" element={<CourseDetail />} />
                    <Route path="/podcasts" element={<Podcasts />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="/articles/:slug" element={<ArticleDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/about" element={<About />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Layout>
    );
}
