from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'avatar')
        read_only_fields = ('role',)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, data):
        return User.objects.create_user(**data)  # role defaults to student


class TeacherSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='__str__')
    course_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'avatar', 'course_count')
