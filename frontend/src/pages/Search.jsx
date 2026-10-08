import { ListGroup } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../api';
import { RESULT } from '../components/SearchBox';
import { Banner, Page, Status } from '../components/ui';
import { useApp } from '../store';

export default function Search() {
    const { t } = useApp();
    const q = (useSearchParams()[0].get('q') || '').trim();
    const results = useApi(q.length >= 2 ? `search/?q=${encodeURIComponent(q)}&limit=20` : null);
    return (
        <>
            <Banner title={t('Search results')} text={`"${q}"`} />
            <Page>
                {q.length < 2 ? <p>{t('Type at least 2 characters.')}</p> : (
                    <Status state={results} empty="No results found.">
                        {list => <ListGroup>{list.map(r => (
                            <ListGroup.Item key={r.type + r.slug} as={Link} to={RESULT[r.type].link(r)} action className="d-flex align-items-center gap-2">
                                <i className={`bi ${RESULT[r.type].icon}`} /><span className="flex-grow-1">{r.title}</span>
                                <small className="opacity-75">{t(RESULT[r.type].label)}</small>
                            </ListGroup.Item>))}
                        </ListGroup>}
                    </Status>
                )}
            </Page>
        </>
    );
}
