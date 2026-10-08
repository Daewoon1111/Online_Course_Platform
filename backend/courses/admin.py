from django.contrib import admin
from django.db.models import Count

from ai.services import course_prompt, fill_drafts

from .models import Course, Enrollment, Lesson, Order, OrderItem


class LessonInline(admin.StackedInline):
    model = Lesson
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'price', 'sale_price', 'sale_end_at', 'students', 'has_draft', 'is_published')
    list_filter = ('is_published', 'teacher')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [LessonInline]
    actions = ['generate_drafts', 'apply_drafts']

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(students=Count('enrollments'))

    @admin.display(ordering='students')
    def students(self, obj):
        return obj.students

    @admin.display(boolean=True, description='AI draft')
    def has_draft(self, obj):
        return bool(obj.description_draft)

    @admin.action(description='AI: write description drafts (review before applying)')
    def generate_drafts(self, request, queryset):
        n = fill_drafts(queryset.select_related('teacher'), course_prompt, 'description_draft')
        self.message_user(request, f'{n}/{queryset.count()} drafts written. Open each course to review "Description draft".')

    @admin.action(description='Apply reviewed drafts to description')
    def apply_drafts(self, request, queryset):
        for c in queryset.exclude(description_draft=''):
            c.description, c.description_draft = c.description_draft, ''
            c.save(update_fields=['description', 'description_draft'])
        self.message_user(request, 'Drafts applied.')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'enrolled_at')
    list_filter = ('course',)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total', 'created_at')
    list_filter = ('status',)
    inlines = [OrderItemInline]
    actions = ['mark_paid']

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('items')

    @admin.action(description='Mark selected orders as paid (creates enrollments)')
    def mark_paid(self, request, queryset):
        for order in queryset.filter(status=Order.Status.PENDING):
            order.mark_paid()
