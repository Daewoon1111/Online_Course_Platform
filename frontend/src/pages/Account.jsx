import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, hoursOf, money, useApi } from '../api';
import { Banner, Page, Status, useSubmit } from '../components/ui';
import { useApp } from '../store';

const Field = props => <Form.Control className="mb-2" {...props} />;

function AuthForms() {
    const { login, t } = useApp();
    const navigate = useNavigate();
    const next = useSearchParams()[0].get('next');
    const done = async data => (login(data), next && navigate(next), '');
    const [onLogin, loginMsg, loginBusy] = useSubmit(async d => done(await api('auth/login/', d)));
    const [onRegister, registerMsg, registerBusy] = useSubmit(async d => done(await api('auth/register/', d)));
    return (
        <Row className="g-4">
            <Col md={6}><Card className="card-soft h-100"><Card.Body>
                <h2 className="h4 fw-black">{t('Login')}</h2>
                <Form onSubmit={onLogin}>
                    <Field name="username" placeholder={t('Username or email')} required autoComplete="username" />
                    <Field name="password" type="password" placeholder={t('Password')} required autoComplete="current-password" />
                    <Button type="submit" variant="accent" disabled={loginBusy}>{t('Login')}</Button>
                </Form>{loginMsg}
            </Card.Body></Card></Col>
            <Col md={6}><Card className="card-soft h-100"><Card.Body>
                <h2 className="h4 fw-black">{t('Create an account')}</h2>
                <Form onSubmit={onRegister}>
                    <Field name="username" placeholder={t('Username')} required autoComplete="username" />
                    <Field name="email" type="email" placeholder={t('Email')} required autoComplete="email" />
                    <Row className="g-2"><Col><Field name="first_name" placeholder={t('First name')} /></Col><Col><Field name="last_name" placeholder={t('Last name')} /></Col></Row>
                    <Field name="password" type="password" placeholder={t('Password (8+ characters)')} minLength={8} required autoComplete="new-password" />
                    <Button type="submit" variant="accent" disabled={registerBusy}>{t('Register')}</Button>
                </Form>{registerMsg}
            </Card.Body></Card></Col>
        </Row>
    );
}

function Dashboard() {
    const { user, logout, t, locale } = useApp();
    const courses = useApi('courses/mine/');
    const orders = useApi('orders/');
    return <>
        <Card className="card-soft mb-4"><Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div><h2 className="h4 fw-black mb-1">{t('Hello')}, {user.first_name || user.username}</h2><span className="text-body-secondary">{user.email} · {t(user.role)}</span></div>
            <Button variant="outline-secondary" onClick={logout}><i className="bi bi-box-arrow-right me-1" />{t('Logout')}</Button>
        </Card.Body></Card>

        <h3 className="fw-black">{t('My Courses')}</h3>
        <Status state={courses} empty={<>{t('No courses yet.')} <Link to="/courses">{t('Browse courses')}</Link></>}>
            {list => <Row xs={1} md={2} className="g-3 mb-4">{list.map(c => (
                <Col key={c.id}><Card as={Link} to={`/courses/${c.slug}`} className="card-soft text-decoration-none text-body"><Card.Body className="d-flex gap-3 align-items-center">
                    <img src={c.thumbnail} alt="" width="64" height="64" className="rounded-3 object-fit-cover" />
                    <div><h6 className="fw-bold mb-1">{c.title}</h6><small>{c.teacher} · {hoursOf(c.duration_min)} {t('hours')}</small></div>
                </Card.Body></Card></Col>))}
            </Row>}
        </Status>

        <h3 className="fw-black">{t('My Orders')}</h3>
        <Status state={orders} empty="No orders yet.">
            {list => <Row xs={1} md={2} className="g-3 mb-4">{list.map(o => (
                <Col key={o.id}><Card className="card-soft"><Card.Body>
                    <h6 className="fw-bold">{t('Order')} #{o.id} · {t(o.status)}</h6>
                    <small className="d-block text-body-secondary">{new Date(o.created_at).toLocaleString(locale)}</small>
                    <small className="d-block">{o.items.map(i => i.course).join(', ')}</small>
                    <strong>{money(o.total)}</strong>
                </Card.Body></Card></Col>))}
            </Row>}
        </Status>
    </>;
}

export default function Account() {
    const { user, t } = useApp();
    return (
        <>
            <Banner title={t('My Account')} text={t(user ? 'Your courses, orders and feedback.' : 'Log in to buy courses and track your learning.')} />
            <Page>{user ? <Dashboard /> : <AuthForms />}</Page>
        </>
    );
}
