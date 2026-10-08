import { useParams } from 'react-router-dom';
import { paragraphs, useApi } from '../api';
import { Page, Status } from '../components/ui';
import { useApp } from '../store';

export default function ArticleDetail() {
    const { t, locale } = useApp();
    const article = useApi(`articles/${useParams().slug}/`);
    return (
        <Page>
            <Status state={article}>
                {a => <article className="mx-auto" style={{ maxWidth: 760 }}>
                    <img src={a.cover} alt={a.title} className="img-fluid rounded-4 mb-4 w-100 detail-img" />
                    <h1 className="fw-black">{a.title}</h1>
                    <p className="text-body-secondary">{a.author && `${a.author} · `}{new Date(a.published_at).toLocaleDateString(locale)} · {a.view_count} {t('readers')}</p>
                    {a.summary && <p className="lead">{a.summary}</p>}
                    {paragraphs(a.body).map((p, i) => <p key={i}>{p}</p>)}
                </article>}
            </Status>
        </Page>
    );
}
