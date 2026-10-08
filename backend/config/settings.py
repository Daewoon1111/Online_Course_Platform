"""Django settings for the online course platform.

All secrets and environment-specific values come from environment variables, optionally loaded
from backend/.env (see .env.example). Dev defaults: DEBUG on, SQLite, React dev server on :5173.
Set POSTGRES_DB (+ POSTGRES_*) to switch to PostgreSQL.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
env = os.environ.get

SECRET_KEY = env('DJANGO_SECRET_KEY', 'django-insecure-dev-only-change-me')
DEBUG = env('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = env('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'users',
    'courses',
    'content',
    'ai',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': env('POSTGRES_DB'),
    'USER': env('POSTGRES_USER', 'postgres'),
    'PASSWORD': env('POSTGRES_PASSWORD', ''),
    'HOST': env('POSTGRES_HOST', 'localhost'),
    'PORT': env('POSTGRES_PORT', '5432'),
    'CONN_MAX_AGE': 60,  # reuse connections between requests
} if env('POSTGRES_DB') else {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': BASE_DIR / 'db.sqlite3',
}}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': f'django.contrib.auth.password_validation.{v}'}
    for v in ('UserAttributeSimilarityValidator', 'MinimumLengthValidator',
              'CommonPasswordValidator', 'NumericPasswordValidator')
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
# Production: `npm run build` in frontend/, Django serves the React app (index.html + hashed assets).
FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'
WHITENOISE_ROOT = FRONTEND_DIST if FRONTEND_DIST.exists() else None
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage' if not DEBUG
                    else 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticatedOrReadOnly'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer']
    + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),
    # Only views that opt in are throttled: anon = login/register/contact, ai = every LLM call.
    'DEFAULT_THROTTLE_RATES': {'anon': '30/hour', 'ai': env('AI_RATE', '30/hour')},
}

# Dev: React (Vite) proxies /api to Django, so CORS is only needed for other origins.
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [o for o in env('CORS_ALLOWED_ORIGINS', '').split(',') if o]

# LLM via OpenRouter (https://openrouter.ai). Pick a model that supports "tools" and "structured_outputs".
OPENROUTER_API_KEY = env('OPENROUTER_API_KEY', '')
OPENROUTER_MODEL = env('OPENROUTER_MODEL', '').strip()
OPENROUTER_TIMEOUT = int(env('OPENROUTER_TIMEOUT', '60'))
# Any OpenAI-compatible chat completions endpoint works (handy for local testing).
OPENROUTER_URL = env('OPENROUTER_URL', 'https://openrouter.ai/api/v1/chat/completions')

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = env('DJANGO_SSL_REDIRECT', '1') == '1'
    SESSION_COOKIE_SECURE = CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_CONTENT_TYPE_NOSNIFF = True
