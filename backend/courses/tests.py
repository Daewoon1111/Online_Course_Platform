from django.test import override_settings
from rest_framework.test import APITestCase

from content.models import ContactMessage, Testimonial
from users.models import User

from .models import Course, Enrollment


class ApiFlowTests(APITestCase):
    def setUp(self):
        teacher = User.objects.create_user('t', 't@x.com', 'pass', role='teacher')
        self.course = Course.objects.create(title='C1', slug='c1', teacher=teacher, duration_min=60,
                                            price='100.00', sale_price='80.00')
        r = self.client.post('/api/auth/register/', {'username': 'stu', 'email': 'stu@x.com', 'password': 'Str0ng-pass!'})
        self.assertEqual(r.status_code, 201)
        self.token = r.data['token']

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token}')

    def test_login_with_email_and_me(self):
        r = self.client.post('/api/auth/login/', {'username': 'STU@x.com', 'password': 'Str0ng-pass!'})
        self.assertEqual((r.status_code, r.data['user']['role']), (200, 'student'))
        self.assertEqual(self.client.post('/api/auth/login/', {'username': 'stu', 'password': 'bad'}).status_code, 400)
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    @override_settings(DEBUG=True)  # mock payment only runs in DEBUG
    def test_order_pay_enrolls_and_snapshots_price(self):
        self.auth()
        order = self.client.post('/api/orders/', {'courses': [self.course.id]}, format='json').data
        self.assertEqual((order['status'], order['total']), ('pending', '80.00'))
        Course.objects.filter(pk=self.course.pk).update(sale_price=None, price='200.00')
        paid = self.client.post(f'/api/orders/{order["id"]}/pay/').data
        self.assertEqual((paid['status'], paid['total']), ('paid', '80.00'))
        self.assertEqual(self.client.post(f'/api/orders/{order["id"]}/pay/').status_code, 400)
        self.assertEqual([c['slug'] for c in self.client.get('/api/courses/mine/').data], ['c1'])
        self.assertEqual(self.client.get('/api/courses/c1/').data['students'], 1)
        self.assertTrue(self.client.get('/api/courses/c1/').data['enrolled'])
        r = self.client.post('/api/orders/', {'courses': [self.course.id]}, format='json')
        self.assertEqual(r.status_code, 400)  # already enrolled
        self.assertEqual(Enrollment.objects.count(), 1)

    def test_orders_need_login_and_mock_pay_is_off_in_production(self):
        self.assertEqual(self.client.get('/api/orders/').status_code, 401)
        self.assertFalse(self.client.get('/api/courses/c1/').data['enrolled'])  # guest
        self.auth()
        self.assertEqual(self.client.post('/api/orders/', {'courses': []}, format='json').status_code, 400)
        order = self.client.post('/api/orders/', {'courses': [self.course.id]}, format='json').data
        self.assertEqual(self.client.post(f'/api/orders/{order["id"]}/pay/').status_code, 503)

    def test_search_suggestions_cover_all_types(self):
        from content.models import Article, Podcast
        Podcast.objects.create(title='C1 talk', host='h', duration_sec=60)
        Article.objects.create(title='Read C1', slug='read-c1')
        r = self.client.get('/api/search/?q=c1')
        self.assertEqual(sorted(x['type'] for x in r.data), ['article', 'course', 'podcast'])
        self.assertEqual(self.client.get('/api/search/?q=c').data, [])

    def test_testimonial_waits_for_approval_and_contact_is_public(self):
        self.auth()
        self.assertEqual(self.client.post('/api/testimonials/', {'content': 'Nice'}).status_code, 201)
        self.assertEqual(self.client.get('/api/testimonials/').data, [])
        Testimonial.objects.update(is_approved=True)
        self.assertEqual(self.client.get('/api/testimonials/').data[0]['user'], 'stu')
        self.client.credentials()
        r = self.client.post('/api/contact/', {'name': 'A', 'email': 'a@x.com', 'message': 'Hi'})
        self.assertEqual((r.status_code, ContactMessage.objects.count()), (201, 1))
