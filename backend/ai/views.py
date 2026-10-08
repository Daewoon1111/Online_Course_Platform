from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .llm import LLMError
from .serializers import ChatSerializer
from .services import advise


class AIThrottle(UserRateThrottle):
    """Limits paid LLM calls per user (or per IP for guests). Rate: REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['ai']."""
    scope = 'ai'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AIThrottle])
def chat(request):
    s = ChatSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    try:
        return Response(advise(s.validated_data['messages']))
    except LLMError as e:
        return Response({'detail': str(e)}, status=503)
