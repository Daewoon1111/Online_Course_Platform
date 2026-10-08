import json
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

from content.models import Article, Testimonial
from courses.models import Course, Enrollment, Lesson
from users.models import User

from .llm import LLMError, structured
from .services import article_prompt, fill_drafts, retrieve


def reply(content='', tool_calls=None):
    message = {'role': 'assistant', 'content': content} | ({'tool_calls': tool_calls} if tool_calls else {})
    return Mock(ok=True, json=Mock(return_value={'choices': [{'message': message}]}))


def call(name, **args):
    return {'id': 'c1', 'type': 'function', 'function': {'name': name, 'arguments': json.dumps(args)}}


AI = override_settings(OPENROUTER_API_KEY='test-key', OPENROUTER_MODEL='test/model')


@AI
class AiApiTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user('t', 't@x.com', 'pass', role='teacher', first_name='Tom')
        self.course = Course.objects.create(title='Money Talks', slug='money-talks', teacher=self.teacher,
                                            duration_min=60, price='100.00', description='Budgeting basics.')
        Lesson.objects.create(course=self.course, order=1, title='Inflation',
                              content='Inflation is a general rise in prices.\n\nBudgets help you plan spending.')
        self.student = User.objects.create_user('s', 's@x.com', 'pass')

    @patch('ai.llm.requests.post')
    def test_chat_uses_tools_and_returns_mentioned_courses(self, post):
        post.side_effect = [reply(tool_calls=[call('search_courses', query='budget')]),
                            reply('Try Money Talks, it covers budgeting.')]
        r = self.client.post('/api/chat/', {'messages': [{'role': 'user', 'content': 'I want to learn budgeting'}]}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['courses'], [{'slug': 'money-talks', 'title': 'Money Talks', 'current_price': '100.00'}])
        sent = post.call_args_list[1].kwargs['json']['messages']
        self.assertEqual((sent[-1]['role'], json.loads(sent[-1]['content'])[0]['slug']), ('tool', 'money-talks'))

    @patch('ai.llm.requests.post')
    def test_chat_reports_provider_error_and_accepts_content_parts(self, post):
        post.return_value = Mock(ok=False, status_code=429, json=Mock(return_value={'error': {'message': 'Rate limit exceeded'}}))
        r = self.client.post('/api/chat/', {'messages': [{'role': 'user', 'content': 'hi'}]}, format='json')
        self.assertEqual((r.status_code, r.data['detail']), (503, 'AI service error 429: Rate limit exceeded'))
        post.return_value = Mock(ok=True, json=Mock(return_value={'choices': [{'message': {'content': [{'type': 'text', 'text': 'Hello'}]}}]}))
        self.assertEqual(self.client.post('/api/chat/', {'messages': [{'role': 'user', 'content': 'hi'}]}, format='json').data['reply'], 'Hello')

    def test_chat_validates_input_and_reports_missing_config(self):
        self.assertEqual(self.client.post('/api/chat/', {'messages': []}, format='json').status_code, 400)
        with override_settings(OPENROUTER_API_KEY=''):
            r = self.client.post('/api/chat/', {'messages': [{'role': 'user', 'content': 'hi'}]}, format='json')
        self.assertEqual(r.status_code, 503)

    @patch('ai.llm.requests.post')
    def test_new_comment_gets_ai_label_but_stays_unapproved(self, post):
        post.return_value = reply('```json\n{"label": "spam", "reason": "Advertising link."}\n```')
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/testimonials/', {'content': 'Buy cheap pills'}).status_code, 201)
        post.side_effect = LLMError  # AI down: comment still saved, unchecked
        self.client.post('/api/testimonials/', {'content': 'Nice course'})
        self.assertEqual(list(Testimonial.objects.order_by('id').values_list('ai_label', 'is_approved')),
                         [('spam', False), ('', False)])

    @patch('ai.llm.requests.post')
    def test_lesson_qa_and_quiz_need_enrollment(self, post):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/courses/money-talks/ask/', {'question': 'What is inflation?'}).status_code, 403)
        self.assertNotIn('content', self.client.get('/api/courses/money-talks/lessons/').data['lessons'][0])
        Enrollment.objects.create(user=self.student, course=self.course)
        post.return_value = reply('Inflation is a general rise in prices.')
        r = self.client.post('/api/courses/money-talks/ask/', {'question': 'What is inflation?'})
        self.assertEqual((r.status_code, r.data['sources']), (200, ['Inflation']))
        good = {'question': 'Q?', 'options': ['a', 'b', 'c', 'd'], 'answer_index': 1, 'explanation': 'e'}
        post.return_value = reply(json.dumps({'questions': [good, good | {'answer_index': 7}, good | {'options': ['a']}]}))
        r = self.client.post('/api/courses/money-talks/quiz/')
        self.assertEqual((r.status_code, len(r.data['questions'])), (200, 1))


class AiUnitTests(TestCase):
    def test_retrieve_ranks_relevant_paragraph_first(self):
        t = User.objects.create_user('t', 't@x.com', 'p', role='teacher')
        c = Course.objects.create(title='C', slug='c', teacher=t, duration_min=1, price=1)
        Lesson.objects.create(course=c, title='L', content='Supply and demand.\n\nInterest rates set by central banks.')
        self.assertEqual(retrieve(c, 'Who sets interest rates?')[0][1], 'Interest rates set by central banks.')

    @AI
    @patch('ai.llm.requests.post', return_value=reply('Not JSON at all'))
    def test_structured_rejects_non_json(self, post):
        with self.assertRaises(LLMError):
            structured([], {})

    @AI
    @patch('ai.llm.requests.post', return_value=reply('Short summary.'))
    def test_fill_drafts_saves_draft_only(self, post):
        a = Article.objects.create(title='Markets', slug='markets', body='Body', summary='old')
        self.assertEqual(fill_drafts(Article.objects.all(), article_prompt, 'summary_draft'), 1)
        a.refresh_from_db()
        self.assertEqual((a.summary, a.summary_draft), ('old', 'Short summary.'))
