from decimal import Decimal
from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PaymentTransaction, TokenPurchase
from .serializers import PurchaseTokenSerializer, TokenPurchaseSerializer, PaymentTransactionSerializer
from .utils import generate_unique_token
from notifications.models import Notification
from ingufupay.pagination import StandardPagination
from transactions.reg_tariffs import calculate_units, get_effective_rate, get_category_display


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        meter_id     = request.query_params.get("meter")
        transactions = PaymentTransaction.objects.filter(
            user=request.user
        ).order_by("-created_at")

        if meter_id:
            transactions = transactions.filter(meter_id=meter_id)

        paginator  = StandardPagination()
        result     = paginator.paginate_queryset(transactions, request)
        serializer = PaymentTransactionSerializer(result, many=True)
        return paginator.get_paginated_response(serializer.data)


class TransactionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            tx = PaymentTransaction.objects.get(pk=pk, user=request.user)
        except PaymentTransaction.DoesNotExist:
            raise NotFound("Transaction not found.")
        return Response(PaymentTransactionSerializer(tx).data)


class PurchaseTokenView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # 1) Validate input
        serializer = PurchaseTokenSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        meter   = serializer.validated_data["meter"]
        amount  = serializer.validated_data["amount_rwf"]
        method  = serializer.validated_data["method"]
        ext_ref = serializer.validated_data.get("external_reference")

        # 2) Lock meter row
        meter = meter.__class__.objects.select_for_update().get(pk=meter.pk)

        # 3) Get meter category for REG pricing
        category = getattr(meter, "category", "residential") or "residential"

        # 4) Create payment as PENDING
        payment = PaymentTransaction.objects.create(
            user=request.user,
            meter=meter,
            amount_rwf=amount,
            method=method,
            status=PaymentTransaction.Status.PENDING,
            external_reference=ext_ref
        )

        # 5) Mark as SUCCESS
        payment.status = PaymentTransaction.Status.SUCCESS
        payment.save(update_fields=["status"])

        # 6) Calculate units using REG tariff
        units = calculate_units(
            amount_rwf=amount,
            category=category,
            current_balance=meter.current_balance_units
        )

        # 7) Generate token
        token = generate_unique_token(TokenPurchase)

        # 8) Create token purchase record
        token_purchase = TokenPurchase.objects.create(
            payment=payment,
            meter=meter,
            units_generated=units,
            token_generated=token,
            status=TokenPurchase.Status.DELIVERED
        )

        # 9) Update meter balance
        meter.current_balance_units = (
            meter.current_balance_units + units
        ).quantize(Decimal("0.001"))
        meter.save(update_fields=["current_balance_units", "updated_at"])

        # 10) Notifications
        effective_rate   = get_effective_rate(category, meter.current_balance_units)
        category_display = get_category_display(category)

        Notification.objects.create(
            user=request.user,
            meter=meter,
            notification_type=Notification.Type.PAYMENT,
            title="Token Purchase Successful",
            message=(
                f"You purchased {units} kWh for meter {meter.meter_number}. "
                f"Rate: {effective_rate} FRW/kWh ({category_display}). "
                f"Token: {token}. New balance: {meter.current_balance_units} kWh."
            )
        )

        if meter.is_low_balance:
            Notification.objects.create(
                user=request.user,
                meter=meter,
                notification_type=Notification.Type.LOW_BALANCE,
                title="Low Balance Alert",
                message=(
                    f"Your meter '{meter.name}' is low on units. "
                    f"Remaining: {meter.current_balance_units} kWh."
                )
            )

        # 11) Return response
        return Response(
            {
                "payment_id":        str(payment.id),
                "meter":             str(meter.id),
                "token":             token_purchase.token_generated,
                "units":             str(token_purchase.units_generated),
                "new_balance_units": str(meter.current_balance_units),
                "low_balance":       meter.is_low_balance,
                "rate_frw_per_kwh":  str(effective_rate),
                "category":          category_display,
            },
            status=status.HTTP_201_CREATED
        )