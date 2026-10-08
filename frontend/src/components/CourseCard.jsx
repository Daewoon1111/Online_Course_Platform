import { Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { hoursOf, money } from '../api';
import { useApp } from '../store';

const daysLeft = d => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5));

export function Price({ c }) {
    const { t } = useApp();
    return (
        <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fs-5 fw-black">{money(c.current_price)}</span>
            {c.on_sale && <>
                <s className="text-body-secondary small">{money(c.price)}</s>
                <Badge bg="danger">-{c.discount_percent}%</Badge>
                {c.sale_end_at && <small className="text-danger">{daysLeft(c.sale_end_at)} {t('days left')}</small>}
            </>}
        </div>
    );
}

// Bought: open the course. Not bought: add to cart (or go to cart if already there).
export function CartButton({ c, ...props }) {
    const { inCart, addToCart, t } = useApp();
    if (c.enrolled) return <Button as={Link} to={`/courses/${c.slug}`} variant="success" {...props}><i className="bi bi-play-circle me-1" />{t('Go to course')}</Button>;
    return inCart(c.id)
        ? <Button as={Link} to="/cart" variant="outline-secondary" {...props}><i className="bi bi-basket me-1" />{t('In cart')}</Button>
        : <Button variant="accent" onClick={() => addToCart(c)} {...props}><i className="bi bi-plus-lg me-1" />{t('Add to cart')}</Button>;
}

export const CourseMeta = ({ c }) => {
    const { t } = useApp();
    return <><i className="bi bi-person me-1" />{c.teacher} · <i className="bi bi-clock me-1" />{hoursOf(c.duration_min)} {t('hours')} · <i className="bi bi-people me-1" />{c.students} {t('students')}</>;
};

export default function CourseCard({ c }) {
    return (
        <Card className="card-soft h-100">
            <Link to={`/courses/${c.slug}`}><Card.Img variant="top" src={c.thumbnail} alt={c.title} className="course-img" loading="lazy" /></Link>
            <Card.Body className="d-flex flex-column">
                <Card.Title as={Link} to={`/courses/${c.slug}`} className="h6 fw-bold text-body text-decoration-none">{c.title}</Card.Title>
                <p className="small text-body-secondary mb-2"><CourseMeta c={c} /></p>
                <Card.Text className="small flex-grow-1">{c.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <Price c={c} />
                    <CartButton c={c} size="sm" />
                </div>
            </Card.Body>
        </Card>
    );
}
