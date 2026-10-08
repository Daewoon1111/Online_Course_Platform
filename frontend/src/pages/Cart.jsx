import { useState } from 'react';
import { Alert, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { Banner, Page } from '../components/ui';
import { useApp } from '../store';

export default function Cart() {
    const { cart, removeFromCart, clearCart, user, t } = useApp();
    const [state, setState] = useState({});
    const navigate = useNavigate();
    const total = cart.reduce((s, c) => s + +c.current_price, 0);

    // Server creates the order with its own prices; the cart total here is only a preview
    const checkout = async () => {
        if (!user) return navigate('/account?next=/cart');
        setState({ busy: true });
        try {
            const order = await api('orders/', { courses: cart.map(c => c.id) });
            const paid = await api(`orders/${order.id}/pay/`, {});
            clearCart();
            setState({ paid });
        } catch (err) {
            setState({ error: err.message });
        }
    };

    return (
        <>
            <Banner title={t('Your Cart')} text={t('Review your courses and check out.')} />
            <Page>
                {state.paid ? <Alert variant="success">
                    {t('Order')} #{state.paid.id} {t('is')} {t(state.paid.status)} ({money(state.paid.total)}). <Link to="/account">{t('Go to my courses')}</Link>
                </Alert> : !cart.length ? <p>{t('Your cart is empty.')} <Link to="/courses">{t('Browse courses')}</Link></p> : <>
                    {cart.map(c => (
                        <Card key={c.id} className="card-soft mb-3"><Card.Body className="d-flex align-items-center gap-3 flex-wrap">
                            <img src={c.thumbnail} alt="" width="72" height="72" className="rounded-3 object-fit-cover" />
                            <Link to={`/courses/${c.slug}`} className="fw-bold text-body flex-grow-1">{c.title}</Link>
                            <strong>{money(c.current_price)}</strong>
                            <Button variant="outline-secondary" size="sm" onClick={() => removeFromCart(c.id)}><i className="bi bi-trash me-1" />{t('Remove')}</Button>
                        </Card.Body></Card>
                    ))}
                    <Card className="card-soft"><Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <h4 className="m-0 fw-black">{t('Total')}: {money(total)}</h4>
                        <Button variant="accent" size="lg" onClick={checkout} disabled={state.busy}>{t(user ? 'Checkout' : 'Log in to checkout')}</Button>
                    </Card.Body></Card>
                    {state.error && <Alert variant="danger" className="mt-3">{state.error}</Alert>}
                </>}
            </Page>
        </>
    );
}
