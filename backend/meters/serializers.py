from rest_framework import serializers
from .models import Meter


class MeterSerializer(serializers.ModelSerializer):
    is_active      = serializers.BooleanField(read_only=True)
    is_low_balance = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Meter
        fields = (
            "id",
            "meter_number",
            "name",
            "location",
            "status",
            "low_balance_threshold",
            "current_balance_units",
            "is_active",
            "is_low_balance",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "current_balance_units",
            "created_at",
            "updated_at",
        )


class MeterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Meter
        fields = (
            "meter_number",
            "name",
            "location",
            "low_balance_threshold",
        )

    def validate_meter_number(self, value):
        if Meter.objects.filter(meter_number=value).exists():
            raise serializers.ValidationError(
                "A meter with this number already exists."
            )
        return value

    def create(self, validated_data):
        request = self.context["request"]
        return Meter.objects.create(owner=request.user, **validated_data)


class MeterUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Meter
        fields = (
            "name",
            "location",
            "low_balance_threshold",
            "status",
        )

    def validate_status(self, value):
        # Accept any valid Status choice
        valid = [s.value for s in Meter.Status]
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(valid)}"
            )
        return value