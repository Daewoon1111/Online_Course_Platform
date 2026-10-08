import { useState } from 'react';
import { Button, Card, Carousel, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, useApi } from '../api';
import avatar from '../assets/avatar.webp';
import { CartButton, CourseMeta, Price } from '../components/CourseCard';
import SearchBox from '../components/SearchBox';
import { Banner, SectionTitle, Status, useSubmit } from '../components/ui';
import { useApp } from '../store';

// Comment form in a modal (logged-in users); new comments wait for admin approval
function ShareModal({ show, onHide }) {
    const { user, t } = useApp();
    const [onSubmit, message, busy] = useSubmit(async d => (await api('testimonials/', d), t('Thanks! Your comment will appear after an admin approves it.')));
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton><Modal.Title className="fw-black">{t('Share your experience')}</Modal.Title></Modal.Header>
            <Modal.Body>
                {user ? (
                    <Form onSubmit={onSubmit}>
                        <Form.Control as="textarea" name="content" rows={4} maxLength={500} placeholder={t('What do you think about our courses?')} required className="mb-2" />
                        <Button type="submit" variant="accent" disabled={busy}>{t('Send')}</Button>
                        {message}
                    </Form>
                ) : <p className="mb-0"><Link to="/account" onClick={onHide}>{t('Login')}</Link> {t('to share your experience.')}</p>}
            </Modal.Body>
        </Modal>
    );
}

export default function Home() {
    const { t } = useApp();
    const courses = useApi('courses/');
    const testimonials = useApi('testimonials/');
    const [sharing, setSharing] = useState(false);
    const toSlider = () => document.getElementById('slider').scrollIntoView({ behavior: 'smooth' });

    return (
        <>
            <Banner title={t('Welcome to the Economic Communication Center')} text={t('Your gateway to understanding economics through engaging content.')}>
                <Button variant="accent" className="mt-4 px-4" onClick={toSlider}>{t("Let's Get Started")} <i className="bi bi-arrow-down" /></Button>
                <SearchBox size="lg" className="hero-search mx-auto mt-4" />
            </Banner>

            <main className="page-bg pb-5">
                <Container>
                    <SectionTitle id="slider" action={<Link to="/courses">{t('All courses')} <i className="bi bi-chevron-right" /></Link>}>
                        {t('Popular courses')}
                    </SectionTitle>
                    <Status state={courses}>
                        {list => (
                            <Carousel className="course-slider card-soft overflow-hidden" interval={5000} pause="hover">
                                {[...list].sort((a, b) => b.students - a.students).slice(0, 5).map(c => (
                                    <Carousel.Item key={c.id}>
                                        <Row className="g-0 align-items-center">
                                            <Col md={6}><img src={c.thumbnail} alt={c.title} className="slider-img" /></Col>
                                            <Col md={6} className="slide-text p-4 p-lg-5 d-flex flex-column justify-content-center">
                                                <h3 className="fw-black">{c.title}</h3>
                                                <p className="small text-body-secondary"><CourseMeta c={c} /></p>
                                                <p>{c.description}</p>
                                                <Price c={c} />
                                                <div className="d-flex gap-2 mt-3 flex-wrap">
                                                    <Button as={Link} to={`/courses/${c.slug}`} variant="outline-secondary">{t('View course')}</Button>
                                                    <CartButton c={c} />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Carousel.Item>
                                ))}
                            </Carousel>
                        )}
                    </Status>

                    <SectionTitle id="comments" action={<Button variant="outline-secondary" size="sm" onClick={() => setSharing(true)}><i className="bi bi-chat-quote me-1" />{t('Share your experience')}</Button>}>
                        {t('What our students say')}
                    </SectionTitle>
                    <Status state={testimonials} empty="No comments yet.">
                        {list => <Row xs={1} md={2} lg={3} className="g-3">{list.slice(0, 6).map(c => (
                            <Col key={c.id}>
                                <Card className="card-comment h-100"><Card.Body className="d-flex gap-3">
                                    <img src={c.avatar || avatar} alt="" width="40" height="40" className="rounded-circle flex-shrink-0" />
                                    <div><p className="fst-italic mb-1">"{c.content}"</p><small className="fw-bold">{c.user}</small></div>
                                </Card.Body></Card>
                            </Col>))}
                        </Row>}
                    </Status>
                </Container>
            </main>
            <ShareModal show={sharing} onHide={() => setSharing(false)} />
        </>
    );
}
