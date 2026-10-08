from django.contrib import admin

from ai.llm import LLMError
from ai.services import article_prompt, fill_drafts, moderate

from .models import Article, ContactMessage, Podcast, Testimonial


@admin.register(Podcast)
class PodcastAdmin(admin.ModelAdmin):
    list_display = ('title', 'host', 'duration_sec', 'published_at', 'listen_count')


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'published_at', 'view_count', 'has_draft')
    prepopulated_fields = {'slug': ('title',)}
    actions = ['generate_drafts', 'apply_drafts']

    @admin.display(boolean=True, description='AI draft')
    def has_draft(self, obj):
        return bool(obj.summary_draft)

    @admin.action(description='AI: write summary drafts (review before applying)')
    def generate_drafts(self, request, queryset):
        n = fill_drafts(queryset, article_prompt, 'summary_draft')
        self.message_user(request, f'{n}/{queryset.count()} drafts written. Open each article to review "Summary draft".')

    @admin.action(description='Apply reviewed drafts to summary')
    def apply_drafts(self, request, queryset):
        for a in queryset.exclude(summary_draft=''):
            a.summary, a.summary_draft = a.summary_draft[:300], ''
            a.save(update_fields=['summary', 'summary_draft'])
        self.message_user(request, 'Drafts applied.')


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'ai_label', 'ai_reason', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'ai_label')
    list_editable = ('is_approved',)
    actions = ['approve', 'run_moderation']

    @admin.action(description='Approve selected')
    def approve(self, request, queryset):
        self.message_user(request, f'{queryset.update(is_approved=True)} approved.')

    @admin.action(description='AI: check selected (suggestion only)')
    def run_moderation(self, request, queryset):
        done = 0
        for t in queryset:
            try:
                r = moderate(t.content)
            except LLMError as e:
                self.message_user(request, str(e), level='error')
                break
            t.ai_label, t.ai_reason = r['label'], r['reason'][:300]
            t.save(update_fields=['ai_label', 'ai_reason'])
            done += 1
        self.message_user(request, f'{done} checked.')


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'created_at')
    readonly_fields = ('name', 'email', 'message', 'created_at')
