from django.db.models import Q
from rest_framework import generics, mixins, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from ai.llm import LLMError
from ai.services import moderate
from courses.models import Course

from .models import Article, Podcast, Testimonial
from .serializers import ArticleSerializer, ContactMessageSerializer, PodcastSerializer, TestimonialSerializer


class PodcastViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Podcast.objects.all()
    serializer_class = PodcastSerializer


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Article.objects.select_related('author')
    serializer_class = ArticleSerializer
    lookup_field = 'slug'


class TestimonialViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Anyone reads approved testimonials; logged-in users submit new ones, shown after admin approval."""
    queryset = Testimonial.objects.filter(is_approved=True).select_related('user').order_by('-created_at')
    serializer_class = TestimonialSerializer

    def perform_create(self, serializer):
        try:  # AI only labels; an admin always makes the approval decision
            r = moderate(serializer.validated_data['content'])
            label = {'ai_label': r['label'], 'ai_reason': r['reason'][:300]}
        except LLMError:
            label = {}  # unchecked: admin reviews it manually
        serializer.save(user=self.request.user, is_approved=False, **label)


class ContactMessageView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]


@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    """Suggestions for the search box: [{type, title, slug}] from courses, podcasts and articles."""
    q = request.query_params.get('q', '').strip()[:100]
    limit = min(int(request.query_params.get('limit', '5')) if request.query_params.get('limit', '').isdigit() else 5, 20)
    if len(q) < 2:
        return Response([])
    sources = [
        ('course', Course.objects.filter(Q(title__icontains=q) | Q(description__icontains=q), is_published=True), 'slug'),
        ('podcast', Podcast.objects.filter(Q(title__icontains=q) | Q(host__icontains=q)), 'id'),
        ('article', Article.objects.filter(Q(title__icontains=q) | Q(summary__icontains=q)), 'slug'),
    ]
    return Response([{'type': kind, 'title': title, 'slug': str(key)}
                     for kind, qs, field in sources for title, key in qs.values_list('title', field)[:limit]])

