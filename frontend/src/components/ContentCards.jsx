import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { hms } from '../api';
import { useApp } from '../store';

export function PodcastCard({ p, i }) {
    const { t, locale } = useApp();
    return (
        <Card id={`podcast-${p.id}`} className="card-soft h-100"><Card.Body className="d-flex gap-3">
            <div className={`podcast-icon tone-${i % 3}`}><i className={`bi ${['bi-mic', 'bi-headphones', 'bi-broadcast'][i % 3]}`} /></div>
            <div className="flex-grow-1">
                <h6 className="fw-bold mb-1">{p.audio_url ? <a href={p.audio_url}>{p.title}</a> : p.title}</h6>
                <p className="small text-body-secondary mb-2">
                    {t('Host')}: {p.host}{p.published_at && ` · ${new Date(p.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </p>
                <div className="d-flex justify-content-between small">
                    <span><i className="bi bi-play-circle me-1" />{hms(p.duration_sec)}</span>
                    <span className="pill-green">{p.listen_count} {t('listeners')}</span>
                </div>
            </div>
        </Card.Body></Card>
    );
}

export function ArticleCard({ a }) {
    const { t } = useApp();
    return (
        <Card className="card-soft h-100">
            <Card.Img variant="top" src={a.cover} alt={a.title} className="article-img" loading="lazy" />
            <Card.Body className="d-flex flex-column">
                <h6 className="fw-bold">{a.title}</h6>
                <p className="small flex-grow-1">{a.summary}</p>
                <div className="d-flex justify-content-between align-items-center small">
                    <span className="pill-green">{a.view_count} {t('readers')}</span>
                    <Link to={`/articles/${a.slug}`}>{t('Read more')} <i className="bi bi-chevron-right" /></Link>
                </div>
            </Card.Body>
        </Card>
    );
}
