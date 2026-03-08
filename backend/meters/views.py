import secrets
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Meter
from .serializers import MeterSerializer, MeterCreateSerializer, MeterUpdateSerializer
from ingufupay.pagination import StandardPagination
from notifications.models import Notification


class MeterListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        meters     = Meter.objects.filter(owner=request.user)
        paginator  = StandardPagination()
        result     = paginator.paginate_queryset(meters, request)
        serializer = MeterSerializer(result, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = MeterCreateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        meter = serializer.save()
        return Response(MeterSerializer(meter).data, status=status.HTTP_201_CREATED)


class MeterDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            meter = Meter.objects.get(pk=pk)
        except Meter.DoesNotExist:
            raise NotFound("Meter not found.")
        if meter.owner != user:
            raise PermissionDenied("You do not own this meter.")
        return meter

    def get(self, request, pk):
        meter = self.get_object(pk, request.user)
        return Response(MeterSerializer(meter).data)

    def patch(self, request, pk):
        meter = self.get_object(pk, request.user)
        serializer = MeterUpdateSerializer(meter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        meter = serializer.save()
        return Response(MeterSerializer(meter).data)

    def delete(self, request, pk):
        meter = self.get_object(pk, request.user)
        meter.status = Meter.Status.INACTIVE
        meter.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Meter deactivated."}, status=status.HTTP_200_OK)


class MeterGenerateDeviceTokenView(APIView):
    """POST /api/meters/<id>/generate-device-token/
    Generates a secret token the ESP32 uses to authenticate with Django.
    Call this once when setting up the ESP32 for a meter.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            meter = Meter.objects.get(pk=pk, owner=request.user)
        except Meter.DoesNotExist:
            raise NotFound("Meter not found.")

        token            = secrets.token_hex(32)
        meter.device_token = token
        meter.save(update_fields=["device_token", "updated_at"])

        return Response({
            "device_token": token,
            "meter_number": meter.meter_number,
            "message": "Copy this token into your ESP32 code. It will not be shown again."
        })


class ESP32ReportView(APIView):
    """POST /api/meters/esp32/report/
    Called by the ESP32 every 30 seconds to report remaining units.
    No user auth — uses device_token instead.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        meter_number  = request.data.get("meter_number")
        device_token  = request.data.get("device_token")
        remaining     = request.data.get("remaining_units")

        if not all([meter_number, device_token, remaining is not None]):
            return Response(
                {"detail": "meter_number, device_token, and remaining_units are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            meter = Meter.objects.get(
                meter_number=meter_number,
                device_token=device_token
            )
        except Meter.DoesNotExist:
            return Response(
                {"detail": "Invalid meter or token."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        old_balance = meter.current_balance_units
        meter.current_balance_units = max(Decimal(str(remaining)), Decimal("0"))
        meter.last_seen             = timezone.now()
        meter.save(update_fields=["current_balance_units", "last_seen", "updated_at"])

        # Send low balance notification if threshold crossed
        if meter.is_low_balance and old_balance > meter.low_balance_threshold:
            Notification.objects.create(
                user=meter.owner,
                meter=meter,
                notification_type=Notification.Type.LOW_BALANCE,
                title="Low Balance Alert",
                message=(
                    f"Your meter '{meter.name}' is running low. "
                    f"Remaining: {meter.current_balance_units} units."
                )
            )

        return Response({
            "detail":          "Units updated.",
            "remaining_units": str(meter.current_balance_units),
            "relay":           "on" if meter.current_balance_units > 0 else "off",
        })


class ESP32PollView(APIView):
    """GET /api/meters/esp32/poll/?meter_number=XXX&device_token=YYY
    ESP32 polls this to check if new units have been added.
    Returns purchased_units so ESP32 can add them.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        meter_number = request.query_params.get("meter_number")
        device_token = request.query_params.get("device_token")

        if not meter_number or not device_token:
            return Response(
                {"detail": "meter_number and device_token are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            meter = Meter.objects.get(
                meter_number=meter_number,
                device_token=device_token
            )
        except Meter.DoesNotExist:
            return Response(
                {"detail": "Invalid meter or token."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        meter.last_seen = timezone.now()
        meter.save(update_fields=["last_seen"])

        return Response({
            "purchased_units": str(meter.current_balance_units),
            "relay":           "on" if meter.current_balance_units > 0 else "off",
            "meter_name":      meter.name,
        })