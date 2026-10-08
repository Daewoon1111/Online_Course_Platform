from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Podcast(models.Model):
    title = models.CharField(max_length=200)
    host = models.CharField(max_length=100)
    audio_url = models.URLField(blank=True)
    duration_sec = models.PositiveIntegerField()
    published_at = models.DateField(null=True, blank=True)
    listen_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.title


class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    summary = models.CharField(max_length=300, blank=True)
    summary_draft = models.TextField(blank=True, help_text='AI draft. Review it, then use the "Apply drafts" action.')
    body = models.TextField(blank=True)
    cover = models.ImageField(upload_to='articles/', blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles')
    published_at = models.DateTimeField(auto_now_add=True)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.title


class Testimonial(models.Model):
    class Label(models.TextChoices):
        UNCHECKED = '', 'Not checked'
        CLEAN = 'clean', 'Clean'
        SPAM = 'spam', 'Spam'
        TOXIC = 'toxic', 'Toxic'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='testimonials')
    content = models.TextField()
    is_approved = models.BooleanField(default=False)  # only an admin sets this
    ai_label = models.CharField(max_length=10, choices=Label.choices, blank=True)  # AI suggestion, never auto-approves
    ai_reason = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['is_approved', '-created_at'])]

    def __str__(self):
        return f'{self.user}: {self.content[:30]}'


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} <{self.email}>'
