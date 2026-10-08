from rest_framework import serializers


class MessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(['user', 'assistant'])
    content = serializers.CharField(max_length=1000, trim_whitespace=True)


class ChatSerializer(serializers.Serializer):
    messages = MessageSerializer(many=True, allow_empty=False, max_length=12)

    def validate_messages(self, value):
        if value[-1]['role'] != 'user':
            raise serializers.ValidationError('The last message must be from the user.')
        return value


class QuestionSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=500)
