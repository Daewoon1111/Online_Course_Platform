import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { api, useApi } from '../api';
import avatar from '../assets/avatar.webp';
import { Banner, Page, Status, useSubmit } from '../components/ui';
import { useApp } from '../store';

const OFFERS = [['courses', 'bi-book', 'Online courses'], ['podcasts', 'bi-mic', 'Podcast episodes'], ['articles', 'bi-newspaper', 'Blog articles']];

function Count({ path }) {
    const { data } = useApi(`${path}/`);
    return <h3 className="display-6 fw-black">{data ? data.length : '-'}</h3>;
}

// About Us + Contact Us (merged, #contact anchor)
export default function About() {
    const { t } = useApp();
    const teachers = useApi('teachers/');
    const [onContact, message, busy] = useSubmit(async d => (await api('contact/', d), t('Thanks! We will reply to your email soon.')));
    return (
        <>
            <Banner title={t('About Us')} text={t('Economics made clear, one lesson at a time.')} />
            <Page>
                <Card className="card-soft mb-5"><Card.Body className="p-4">
                    <h2 className="fw-black">{t('Our Mission')}</h2>
                    <p className="mb-0">{t('Economic Communication Center helps students and working people understand economics and talk about it with confidence. We turn complex ideas into short, practical courses, podcasts and articles in plain English.')}</p>
                </Card.Body></Card>

                <h2 className="fw-black mb-3">{t('What We Offer')}</h2>
                <Row xs={1} md={3} className="g-4 mb-5">
                    {OFFERS.map(([path, icon, label]) => (
                        <Col key={path}><Card className="card-soft text-center h-100"><Card.Body>
                            <i className={`bi ${icon} fs-1`} /><Count path={path} /><p className="mb-0">{t(label)}</p>
                        </Card.Body></Card></Col>
                    ))}
                </Row>

                <h2 className="fw-black mb-3">{t('Our Teachers')}</h2>
                <Status state={teachers}>
                    {list => <Row xs={1} sm={2} lg={3} className="g-3 mb-5">{list.map(x => (
                        <Col key={x.id}><Card className="card-soft"><Card.Body className="d-flex gap-3 align-items-center">
                            <img src={x.avatar || avatar} alt="" width="56" height="56" className="rounded-circle" />
                            <div><h6 className="fw-bold mb-0">{x.name}</h6><small>{x.course_count} {t('course')}</small></div>
                        </Card.Body></Card></Col>))}
                    </Row>}
                </Status>

                <h2 id="contact" className="fw-black mb-3">{t('Contact Us')}</h2>
                <Card className="card-soft"><Card.Body>
                    <Form onSubmit={onContact}>
                        <Row className="g-2 mb-2">
                            <Col md><Form.Control name="name" placeholder={t('Your name')} required autoComplete="name" /></Col>
                            <Col md><Form.Control name="email" type="email" placeholder={t('Your email')} required autoComplete="email" /></Col>
                        </Row>
                        <Form.Control as="textarea" name="message" rows={5} placeholder={t('Your message')} required className="mb-2" />
                        <Button type="submit" variant="accent" disabled={busy}>{t('Send message')}</Button>
                    </Form>{message}
                </Card.Body></Card>
            </Page>
        </>
    );
}
