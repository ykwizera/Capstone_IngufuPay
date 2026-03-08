from rest_framework import serializers
from .models import SupportRequest


class SupportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SupportRequest
        fields = (
            "id", "subject", "category", "message",
            "status", "created_at",
        )
        read_only_fields = ("id", "status", "created_at")