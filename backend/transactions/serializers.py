from decimal import Decimal
from rest_framework import serializers
from .models import PaymentTransaction, TokenPurchase
from meters.models import Meter


class PurchaseTokenSerializer(serializers.Serializer):
    meter              = serializers.PrimaryKeyRelatedField(queryset=Meter.objects.all())
    amount_rwf         = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("1.00"))
    method             = serializers.ChoiceField(choices=PaymentTransaction.Method.choices)
    external_reference = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        request = self.context.get("request")
        if not request:
            raise serializers.ValidationError("Request context is missing.")

        meter = attrs.get("meter")

        if meter.owner != request.user:
            raise serializers.ValidationError({"meter": "You do not own this meter."})

        if not meter.is_active:
            raise serializers.ValidationError({"meter": "This meter is inactive."})

        ext_ref = attrs.get("external_reference")
        if ext_ref and PaymentTransaction.objects.filter(external_reference=ext_ref).exists():
            raise serializers.ValidationError({"external_reference": "This reference already exists."})

        return attrs


class PaymentTransactionSerializer(serializers.ModelSerializer):
    meter_number    = serializers.CharField(source="meter.meter_number", read_only=True)
    meter_name      = serializers.CharField(source="meter.name", read_only=True)
    payment_method  = serializers.CharField(source="method", read_only=True)
    token           = serializers.SerializerMethodField()
    units_purchased = serializers.SerializerMethodField()

    class Meta:
        model  = PaymentTransaction
        fields = (
            "id", "meter", "meter_number", "meter_name",
            "amount_rwf", "payment_method", "status",
            "token", "units_purchased",
            "external_reference", "created_at",
        )
        read_only_fields = ("id", "user", "status", "created_at")

    def get_token(self, obj):
        try:
            return obj.token_purchase.token_generated
        except TokenPurchase.DoesNotExist:
            return None

    def get_units_purchased(self, obj):
        try:
            return str(obj.token_purchase.units_generated)
        except TokenPurchase.DoesNotExist:
            return None


class TokenPurchaseSerializer(serializers.ModelSerializer):
    payment = PaymentTransactionSerializer(read_only=True)

    class Meta:
        model  = TokenPurchase
        fields = (
            "id", "payment", "meter",
            "units_generated", "token_generated",
            "status", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "payment", "meter",
            "units_generated", "token_generated",
            "status", "created_at", "updated_at",
        )