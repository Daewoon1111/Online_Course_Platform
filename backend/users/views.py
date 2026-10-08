from django.contrib.auth import authenticate
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import User
from .serializers import RegisterSerializer, TeacherSerializer, UserSerializer


def token_response(user, status=200):
    token = Token.objects.get_or_create(user=user)[0]
    return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    return token_response(s.save(), 201)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def login(request):
    """Accepts a username or an email in the `username` field."""
    name = request.data.get('username', '')
    name = User.objects.filter(email__iexact=name).values_list('username', flat=True).first() or name
    user = authenticate(username=name, password=request.data.get('password', ''))
    return token_response(user) if user else Response({'detail': 'Invalid username or password.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role=User.Role.TEACHER).annotate(
        course_count=Count('courses', filter=Q(courses__is_published=True))).order_by('id')
    serializer_class = TeacherSerializer
