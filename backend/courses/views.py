from django.conf import settings
from django.db import transaction
from django.db.models import BooleanField, Count, Exists, OuterRef, Value
from rest_framework import filters, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ai.llm import LLMError
from ai.serializers import QuestionSerializer
from ai.services import ask_course, make_quiz
from ai.views import AIThrottle

from .models import Course, Enrollment, Order
from .serializers import CourseSerializer, OrderSerializer


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.filter(is_published=True).select_related('teacher').annotate(students=Count('enrollments'))
    serializer_class = CourseSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        """Adds `enrolled` for the current user so the UI shows "Add to cart" only for courses not bought yet."""
        u = self.request.user
        enrolled = Exists(Enrollment.objects.filter(user=u, course=OuterRef('pk'))) if u.is_authenticated \
            else Value(False, output_field=BooleanField())
        return super().get_queryset().annotate(enrolled=enrolled)

    def has_access(self, course):
        u = self.request.user
        return u.is_authenticated and (u.is_staff or course.teacher_id == u.id or course.enrollments.filter(user=u).exists())

    @action(detail=False, permission_classes=[IsAuthenticated])
    def mine(self, request):
        return Response(self.get_serializer(self.get_queryset().filter(enrollments__user=request.user), many=True).data)

    @action(detail=True)
    def lessons(self, request, slug=None):
        """Everyone sees lesson titles; enrolled users (and staff/teacher) also get the content."""
        course = self.get_object()
        enrolled = self.has_access(course)
        fields = ('id', 'order', 'title', 'content') if enrolled else ('id', 'order', 'title')
        return Response({'enrolled': enrolled, 'lessons': list(course.lessons.values(*fields))})

    def ai_call(self, fn):
        course = self.get_object()
        if not self.has_access(course):
            return Response({'detail': 'Enroll in this course to use the AI assistant.'}, status=403)
        try:
            return Response(fn(course))
        except LLMError as e:
            return Response({'detail': str(e)}, status=503)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], throttle_classes=[AIThrottle])
    def ask(self, request, slug=None):
        s = QuestionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return self.ai_call(lambda c: ask_course(c, s.validated_data['question']))

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], throttle_classes=[AIThrottle])
    def quiz(self, request, slug=None):
        return self.ai_call(lambda c: {'questions': make_quiz(c)})


class OrderViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.prefetch_related('items__course').order_by('-id')

    @transaction.atomic
    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Mock payment, DEBUG only. Plug a real gateway (VNPay, MoMo, Stripe) in here before launch."""
        if not settings.DEBUG:
            return Response({'detail': 'Payment gateway not configured.'}, status=503)
        order = self.get_object()
        if order.status != Order.Status.PENDING:
            return Response({'detail': f'Order is already {order.status}.'}, status=400)
        order.mark_paid()
        return Response(self.get_serializer(order).data)
