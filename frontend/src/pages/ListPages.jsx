import { Col, Row } from 'react-bootstrap';
import { useApi } from '../api';
import { ArticleCard, PodcastCard } from '../components/ContentCards';
import CourseCard from '../components/CourseCard';
import { Banner, Page, Status } from '../components/ui';
import { useApp } from '../store';

// One layout for the three catalogue pages: banner + responsive grid of cards
function ListPage({ title, text, path, cols, render }) {
    const { t } = useApp();
    const state = useApi(path);
    return (
        <>
            <Banner title={t(title)} text={t(text)} />
            <Page>
                <Status state={state}>
                    {list => <Row {...cols} className="g-4">{list.map((x, i) => <Col key={x.id}>{render(x, i)}</Col>)}</Row>}
                </Status>
            </Page>
        </>
    );
}

export const Courses = () => <ListPage title="Courses" text="Learn economics step by step with practical online courses."
    path="courses/" cols={{ xs: 1, md: 2, lg: 3 }} render={c => <CourseCard c={c} />} />;

export const Podcasts = () => <ListPage title="Podcasts" text="Listen and learn on the go."
    path="podcasts/" cols={{ xs: 1, md: 2, lg: 3 }} render={(p, i) => <PodcastCard p={p} i={i} />} />;

export const Articles = () => <ListPage title="Articles" text="Short reads about economics and markets."
    path="articles/" cols={{ xs: 1, sm: 2, lg: 4 }} render={a => <ArticleCard a={a} />} />;
