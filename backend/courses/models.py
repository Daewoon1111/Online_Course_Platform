from django.conf import settings
from django.db import models, transaction
from django.db.models import F, Q
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Course(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    description_draft = models.TextField(blank=True, help_text='AI draft. Review it, then use the "Apply drafts" action.')
    teacher = models.ForeignKey(User, on_delete=models.PROTECT, related_name='courses',
                                limit_choices_to={'role': 'teacher'})
    duration_min = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sale_end_at = models.DateTimeField(null=True, blank=True)
    thumbnail = models.ImageField(upload_to='courses/', blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        constraints = [models.CheckConstraint(
            condition=Q(sale_price__isnull=True) | Q(sale_price__lt=F('price')),
            name='sale_price_lt_price')]

    def __str__(self):
        return self.title

    @property
    def on_sale(self):
        return self.sale_price is not None and (not self.sale_end_at or self.sale_end_at > timezone.now())

    @property
    def current_price(self):
        return self.sale_price if self.on_sale else self.price

    @property
    def discount_percent(self):
        return round(100 - self.sale_price * 100 / self.price) if self.on_sale else 0


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    order = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=200)
    content = models.TextField(help_text='Separate paragraphs with a blank line; the AI assistant searches by paragraph.')

    class Meta:
        ordering = ['course', 'order']
        constraints = [models.UniqueConstraint(fields=['course', 'order'], name='unique_lesson_order')]

    def __str__(self):
        return f'{self.course} #{self.order}: {self.title}'


class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'course'], name='unique_enrollment')]

    def __str__(self):
        return f'{self.user} - {self.course}'


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        CANCELLED = 'cancelled', 'Cancelled'

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Order #{self.pk}'

    @property
    def total(self):
        return sum(i.price for i in self.items.all())

    @transaction.atomic
    def mark_paid(self):
        self.status = self.Status.PAID
        self.save(update_fields=['status'])
        Enrollment.objects.bulk_create(
            [Enrollment(user=self.user, course=i.course) for i in self.items.all()], ignore_conflicts=True)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='order_items')
    price = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot at purchase time

    class Meta:
        constraints = [models.UniqueConstraint(fields=['order', 'course'], name='unique_order_course')]

    def __str__(self):
        return f'{self.course} @ {self.price}'
