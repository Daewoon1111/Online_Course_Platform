from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import FileResponse
from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from ai.views import chat
from content.views import ArticleViewSet, ContactMessageView, PodcastViewSet, TestimonialViewSet, search
from courses.views import CourseViewSet, OrderViewSet
from users import views as auth

router = DefaultRouter()
router.register('courses', CourseViewSet)
router.register('orders', OrderViewSet, basename='order')
router.register('podcasts', PodcastViewSet)
router.register('articles', ArticleViewSet)
router.register('testimonials', TestimonialViewSet)
router.register('teachers', auth.TeacherViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/chat/', chat),
    path('api/search/', search),
    path('api/contact/', ContactMessageView.as_view()),
    path('api/auth/register/', auth.register),
    path('api/auth/login/', auth.login),
    path('api/auth/logout/', auth.logout),
    path('api/auth/me/', auth.me),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Built React app (frontend/dist): every non-API URL returns index.html so client-side routes work.
if (index := settings.FRONTEND_DIST / 'index.html').exists():
    urlpatterns.append(re_path(r'^(?!api/|admin/|media/|static/).*$', lambda request: FileResponse(index.open('rb'))))
