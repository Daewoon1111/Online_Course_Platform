import { Accordion, Badge, Card, Col, Row } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { paragraphs, useApi } from '../api';
import { AskLessons, Quiz } from '../components/CourseAssistant';
import { CartButton, CourseMeta, Price } from '../components/CourseCard';
import { Page, Status } from '../components/ui';
import { useApp } from '../store';

export default function CourseDetail() {
    const { slug } = useParams();
    const { user, t } = useApp();
    const course = useApi(`courses/${slug}/`);
    const lessons = useApi(`courses/${slug}/lessons/`, user?.id); // refetch after login/logout

    return (
        <Page>
            <Status state={course}>
                {c => <>
                    <Row className="g-4 align-items-center mb-4">
                        <Col md={5}><img src={c.thumbnail} alt={c.title} className="img-fluid rounded-4 shadow-sm w-100 detail-img" /></Col>
                        <Col md={7}>
                            <h1 className="fw-black">{c.title}</h1>
                            <p className="text-body-secondary"><CourseMeta c={c} /></p>
                            <p className="lead">{c.description}</p>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <Price c={c} />
                                {c.enrolled || lessons.data?.enrolled
                                    ? <Badge bg="success" className="fs-6"><i className="bi bi-check2-circle me-1" />{t('Enrolled')}</Badge>
                                    : <CartButton c={c} size="lg" />}
                            </div>
                        </Col>
                    </Row>

                    <h2 className="fw-black mb-3">{t('Lessons')}</h2>
                    <Status state={lessons}>
                        {({ enrolled, lessons: list }) => <>
                            {!list.length && <p className="text-body-secondary">{t('Lessons are coming soon.')}</p>}
                            <Accordion className="mb-4">
                                {list.map(l => (
                                    <Accordion.Item key={l.id} eventKey={String(l.id)}>
                                        <Accordion.Header>
                                            <i className={`bi ${enrolled ? 'bi-journal-text' : 'bi-lock'} me-2`} />{l.order}. {l.title}
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            {enrolled ? paragraphs(l.content).map((p, i) => <p key={i}>{p}</p>) : (
                                                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                                    <span className="text-body-secondary">{t('Buy this course to unlock the lesson')}{user ? '' : <> (<Link to="/account">{t('log in')}</Link> {t('first')})</>}.</span>
                                                    <CartButton c={c} size="sm" />
                                                </div>
                                            )}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                            {enrolled && !!list.length && <Row className="g-4"><Col lg={6}><AskLessons slug={slug} /></Col><Col lg={6}><Quiz slug={slug} /></Col></Row>}
                            {!enrolled && <Card body className="card-soft">
                                <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                    <span><i className="bi bi-stars me-2" />{t('Enrolled students get an AI assistant that answers questions from these lessons and builds practice quizzes.')}</span>
                                    <CartButton c={c} />
                                </div>
                            </Card>}
                        </>}
                    </Status>
                </>}
            </Status>
        </Page>
    );
}
