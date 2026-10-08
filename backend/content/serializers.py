from rest_framework import serializers

from .models import Article, ContactMessage, Podcast, Testimonial


class PodcastSerializer(serializers.ModelSerializer):
    class Meta:
        model = Podcast
        fields = '__all__'


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()

    class Meta:
        model = Article
        exclude = ('summary_draft',)


class TestimonialSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    avatar = serializers.ImageField(source='user.avatar', read_only=True)
    content = serializers.CharField(max_length=500)

    class Meta:
        model = Testimonial
        fields = ('id', 'user', 'avatar', 'content', 'created_at')


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ('name', 'email', 'message')
