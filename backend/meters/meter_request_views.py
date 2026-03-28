from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings

from .models import MeterRequest

ADMIN_EMAIL = "y.kwizera@alustudent.com"


class MeterRequestSerializer(serializers.ModelSerializer):
    meter_number = serializers.SerializerMethodField()
    reviewed_by  = serializers.SerializerMethodField()

    class Meta:
        model  = MeterRequest
        fields = [
            "id", "full_name", "id_number", "reason", "reason_details",
            "province", "district", "sector", "cell", "village",
            "status", "rejection_reason", "meter_number",
            "created_at", "reviewed_at", "reviewed_by",
        ]
        read_only_fields = [
            "status", "rejection_reason", "meter_number",
            "created_at", "reviewed_at", "reviewed_by",
        ]

    def get_meter_number(self, obj):
        return obj.meter.meter_number if obj.meter else None

    def get_reviewed_by(self, obj):
        return obj.reviewed_by.username if obj.reviewed_by else None


class MeterRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = MeterRequest.objects.filter(
            user=request.user
        ).order_by("-created_at")
        serializer = MeterRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        if MeterRequest.objects.filter(
            user=request.user, status="pending"
        ).exists():
            return Response(
                {"detail": "You already have a pending meter request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = MeterRequestSerializer(data=request.data)
        if serializer.is_valid():
            meter_request = serializer.save(user=request.user)

            location = (
                f"{meter_request.village}, {meter_request.cell}, "
                f"{meter_request.sector}, {meter_request.district}, "
                f"{meter_request.province}"
            )

            try:
                send_mail(
                    subject=f"[IngufuPay] New Meter Request from {request.user.username}",
                    message=(
                        f"A new meter request has been submitted.\n\n"
                        f"Applicant:  {meter_request.full_name}\n"
                        f"Username:   {request.user.username}\n"
                        f"Email:      {request.user.email}\n"
                        f"ID Number:  {meter_request.id_number}\n"
                        f"Reason:     {meter_request.get_reason_display()}\n\n"
                        f"Location:\n"
                        f"  Province: {meter_request.province}\n"
                        f"  District: {meter_request.district}\n"
                        f"  Sector:   {meter_request.sector}\n"
                        f"  Cell:     {meter_request.cell}\n"
                        f"  Village:  {meter_request.village}\n\n"
                        f"Additional Details:\n{meter_request.reason_details or 'None'}\n\n"
                        f"Submitted: {meter_request.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                        f"Request ID: {meter_request.id}\n\n"
                        f"Please log in to the admin panel to review this request."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[ADMIN_EMAIL],
                    fail_silently=True,
                )
            except Exception:
                pass

            try:
                send_mail(
                    subject="Your meter request has been received — IngufuPay",
                    message=(
                        f"Hi {request.user.username},\n\n"
                        f"We have received your meter request and it is currently under review.\n\n"
                        f"Your Request Details:\n"
                        f"  Full Name:  {meter_request.full_name}\n"
                        f"  ID Number:  {meter_request.id_number}\n"
                        f"  Reason:     {meter_request.get_reason_display()}\n"
                        f"  Location:   {location}\n\n"
                        f"What happens next?\n"
                        f"  Our team will review your request within 1-3 business days.\n"
                        f"  You will receive an email once your request is approved or rejected.\n"
                        f"  You can also check the status in the Meters section of your account.\n\n"
                        f"Request ID: {meter_request.id}\n\n"
                        f"Thank you for choosing IngufuPay!\n"
                        f"— IngufuPay Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[request.user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                from notifications.models import Notification
                for admin in User.objects.filter(role="admin"):
                    Notification.objects.create(
                        user    = admin,
                        title   = "New Meter Request",
                        message = (
                            f"{request.user.username} submitted a meter request "
                            f"in {meter_request.district}, {meter_request.province}."
                        ),
                    )
            except Exception:
                pass

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeterRequestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            r = MeterRequest.objects.get(pk=pk, user=request.user)
        except MeterRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        return Response(MeterRequestSerializer(r).data)

    def delete(self, request, pk):
        try:
            r = MeterRequest.objects.get(pk=pk, user=request.user)
        except MeterRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        # Approved requests cannot be deleted — they are linked to a real meter
        if r.status == "approved":
            return Response(
                {"detail": "Approved requests cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        r.delete()
        return Response({"detail": "Request removed."})