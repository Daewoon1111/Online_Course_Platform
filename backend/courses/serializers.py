from rest_framework import serializers

from .models import Course, Enrollment, Order, OrderItem


class CourseSerializer(serializers.ModelSerializer):
    teacher = serializers.StringRelatedField()
    students = serializers.IntegerField(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    enrolled = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Course
        fields = ('id', 'title', 'slug', 'description', 'teacher', 'duration_min', 'price', 'sale_price',
                  'sale_end_at', 'on_sale', 'current_price', 'discount_percent', 'thumbnail', 'students', 'enrolled')


class OrderItemSerializer(serializers.ModelSerializer):
    course = serializers.StringRelatedField()

    class Meta:
        model = OrderItem
        fields = ('course', 'price')


class OrderSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Course.objects.filter(is_published=True))
    items = OrderItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'status', 'created_at', 'total', 'items', 'courses')
        read_only_fields = ('status',)

    def validate_courses(self, courses):
        if not courses:
            raise serializers.ValidationError('Cart is empty.')
        owned = Enrollment.objects.filter(user=self.context['request'].user, course__in=courses)
        if owned.exists():
            raise serializers.ValidationError(
                'Already enrolled: ' + ', '.join(owned.values_list('course__title', flat=True)) + '.')
        return set(courses)

    def create(self, data):
        order = Order.objects.create(user=self.context['request'].user)
        # price snapshot: later price changes do not touch past orders
        OrderItem.objects.bulk_create(OrderItem(order=order, course=c, price=c.current_price) for c in data['courses'])
        return order
