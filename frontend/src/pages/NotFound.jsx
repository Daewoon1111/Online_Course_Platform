import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Banner } from '../components/ui';
import { useApp } from '../store';

export default function NotFound() {
    const { t } = useApp();
    return (
        <Banner title={t('Page not found')} text={t('The page you are looking for does not exist.')}>
            <Button as={Link} to="/" variant="accent" className="mt-4">{t('Back to home')}</Button>
        </Banner>
    );
}
