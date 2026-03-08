from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SupportRequest
from .serializers import SupportRequestSerializer


SUPPORT_EMAIL = "y.kwizera@alustudent.com"  # ← your email, receives all support requests


class SupportRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SupportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save to database
        support_req = serializer.save(user=request.user)

        # Email to YOU (support inbox)
        try:
            send_mail(
                subject=f"[IngufuPay Support] {support_req.category}: {support_req.subject}",
                message=(
                    f"New support request from {request.user.username} ({request.user.email})\n\n"
                    f"Category: {support_req.category}\n"
                    f"Subject:  {support_req.subject}\n\n"
                    f"Message:\n{support_req.message}\n\n"
                    f"Submitted: {support_req.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                    f"Request ID: {support_req.id}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[SUPPORT_EMAIL],
                fail_silently=True,
            )
        except Exception:
            pass  # Don't fail the request if email fails

        # Confirmation email to USER
        try:
            send_mail(
                subject="We received your support request — IngufuPay",
                message=(
                    f"Hi {request.user.username},\n\n"
                    f"We have received your support request and will get back to you within 2 hours.\n\n"
                    f"Your request details:\n"
                    f"Category: {support_req.category}\n"
                    f"Subject:  {support_req.subject}\n\n"
                    f"If you have any additional information to add, reply to this email.\n\n"
                    f"— IngufuPay Support Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(
            {"detail": "Support request submitted successfully."},
            status=status.HTTP_201_CREATED
        )