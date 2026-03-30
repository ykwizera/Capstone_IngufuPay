from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from meters.models import Meter, MeterRequest, SystemSetting
from transactions.models import PaymentTransaction, TokenPurchase

User = get_user_model()

ADMIN_EMAIL = "y.kwizera@alustudent.com"


# ── Permission helper ─────────────────────────────────────────────────────────
class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and (
            request.user.role == "admin" or request.user.is_staff
        )


# ── Dashboard Overview ────────────────────────────────────────────────────────
class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users        = User.objects.filter(role="customer").count()
        total_meters       = Meter.objects.count()
        total_revenue      = PaymentTransaction.objects.filter(
            status="success"
        ).aggregate(total=Sum("amount_rwf"))["total"] or 0
        pending_requests   = MeterRequest.objects.filter(status="pending").count()
        low_balance_meters = Meter.objects.filter(
            current_balance_units__lte=5, status="active"
        ).count()

        recent_transactions = PaymentTransaction.objects.select_related(
            "user", "meter"
        ).order_by("-created_at")[:10]

        recent_tx_data = [
            {
                "id":         str(t.id),
                "user":       t.user.username,
                "meter":      t.meter.meter_number if t.meter else "—",
                "amount_rwf": str(t.amount_rwf),
                "method":     t.method,
                "status":     t.status,
                "created_at": t.created_at,
            }
            for t in recent_transactions
        ]

        return Response({
            "total_users":         total_users,
            "total_meters":        total_meters,
            "total_revenue":       str(total_revenue),
            "pending_requests":    pending_requests,
            "low_balance_meters":  low_balance_meters,
            "recent_transactions": recent_tx_data,
        })


# ── Meter Requests ────────────────────────────────────────────────────────────
class AdminMeterRequestListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = MeterRequest.objects.select_related("user", "meter", "reviewed_by")

        status_filter   = request.query_params.get("status")
        province_filter = request.query_params.get("province")
        district_filter = request.query_params.get("district")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if province_filter:
            qs = qs.filter(province=province_filter)
        if district_filter:
            qs = qs.filter(district=district_filter)

        data = [
            {
                "id":               r.id,
                "user":             r.user.username,
                "user_email":       r.user.email,
                "full_name":        r.full_name,
                "id_number":        r.id_number,
                "reason":           r.reason,
                "reason_details":   r.reason_details,
                "province":         r.province,
                "district":         r.district,
                "sector":           r.sector,
                "cell":             r.cell,
                "village":          r.village,
                "status":           r.status,
                "rejection_reason": r.rejection_reason,
                "meter_number":     r.meter.meter_number if r.meter else None,
                "created_at":       r.created_at,
                "reviewed_at":      r.reviewed_at,
                "reviewed_by":      r.reviewed_by.username if r.reviewed_by else None,
            }
            for r in qs
        ]
        return Response(data)


class AdminMeterRequestDetailView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            meter_request = MeterRequest.objects.select_related("user").get(pk=pk)
        except MeterRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=404)

        if meter_request.status != "pending":
            return Response(
                {"detail": "This request has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        action = request.data.get("action")
        user   = meter_request.user
        location = (
            f"{meter_request.village}, {meter_request.cell}, "
            f"{meter_request.sector}, {meter_request.district}, "
            f"{meter_request.province}"
        )

        if action == "approve":
            meter_number = meter_request.assign_meter_number()

            meter = Meter.objects.create(
                owner        = user,
                meter_number = meter_number,
                name         = meter_request.meter_name,
                province     = meter_request.province,
                district     = meter_request.district,
                sector       = meter_request.sector,
                cell         = meter_request.cell,
                village      = meter_request.village,
                location     = location,
                status       = Meter.Status.ACTIVE,
            )

            meter_request.status      = "approved"
            meter_request.meter       = meter
            meter_request.reviewed_at = timezone.now()
            meter_request.reviewed_by = request.user
            meter_request.save()

            # In-app notification
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user    = user,
                    title   = "Meter Request Approved",
                    message = (
                        f"Your meter request has been approved! "
                        f"Your meter number is {meter_number}. "
                        f"You can now buy tokens for your meter."
                    ),
                )
            except Exception:
                pass

            # Email to user
            try:
                send_mail(
                    subject="Your meter request has been approved — IngufuPay",
                    message=(
                        f"Hi {user.username},\n\n"
                        f"Great news! Your meter request has been approved.\n\n"
                        f"Your Meter Details:\n"
                        f"  Meter Number: {meter_number}\n"
                        f"  Location:     {location}\n\n"
                        f"What you can do now:\n"
                        f"  - Log in to your IngufuPay account\n"
                        f"  - Go to the Meters section to see your new meter\n"
                        f"  - Click 'Buy Token' to purchase electricity units\n\n"
                        f"Thank you for choosing IngufuPay!\n"
                        f"— IngufuPay Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

            return Response({
                "detail":       "Meter request approved.",
                "meter_number": meter_number,
            })

        elif action == "reject":
            reason = request.data.get("reason", "")
            if not reason:
                return Response(
                    {"detail": "Please provide a rejection reason."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            meter_request.status           = "rejected"
            meter_request.rejection_reason = reason
            meter_request.reviewed_at      = timezone.now()
            meter_request.reviewed_by      = request.user
            meter_request.save()

            # In-app notification
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user    = user,
                    title   = "Meter Request Rejected",
                    message = f"Your meter request was rejected. Reason: {reason}",
                )
            except Exception:
                pass

            # Email to user
            try:
                send_mail(
                    subject="Update on your meter request — IngufuPay",
                    message=(
                        f"Hi {user.username},\n\n"
                        f"We regret to inform you that your meter request has been rejected.\n\n"
                        f"Request Details:\n"
                        f"  Location: {location}\n\n"
                        f"Reason for rejection:\n"
                        f"  {reason}\n\n"
                        f"What you can do:\n"
                        f"  - Address the issue mentioned above\n"
                        f"  - Submit a new meter request from your account\n"
                        f"  - Contact support if you need help\n\n"
                        f"We apologize for any inconvenience.\n"
                        f"— IngufuPay Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

            return Response({"detail": "Meter request rejected."})

        return Response(
            {"detail": "Invalid action. Use 'approve' or 'reject'."},
            status=status.HTTP_400_BAD_REQUEST
        )


# ── User Management ───────────────────────────────────────────────────────────
class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = User.objects.filter(role="customer").order_by("-date_joined")

        province = request.query_params.get("province")
        district = request.query_params.get("district")
        search   = request.query_params.get("search")

        if province:
            qs = qs.filter(province=province)
        if district:
            qs = qs.filter(district=district)
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )

        data = [
            {
                "id":           u.id,
                "username":     u.username,
                "email":        u.email,
                "phone_number": u.phone_number,
                "province":     u.province,
                "district":     u.district,
                "is_active":    u.is_active,
                "meter_count":  u.meters.count(),
                "date_joined":  u.date_joined,
            }
            for u in qs
        ]
        return Response(data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            u = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        meters       = u.meters.all()
        transactions = PaymentTransaction.objects.filter(
            user=u
        ).order_by("-created_at")[:10]

        return Response({
            "id":           u.id,
            "username":     u.username,
            "email":        u.email,
            "phone_number": u.phone_number,
            "province":     u.province,
            "district":     u.district,
            "sector":       u.sector,
            "cell":         u.cell,
            "village":      u.village,
            "is_active":    u.is_active,
            "date_joined":  u.date_joined,
            "meters": [
                {
                    "id":           m.id,
                    "meter_number": m.meter_number,
                    "name":         m.name,
                    "status":       m.status,
                    "balance":      str(m.current_balance_units),
                    "province":     m.province,
                    "district":     m.district,
                }
                for m in meters
            ],
            "recent_transactions": [
                {
                    "id":         str(t.id),
                    "amount_rwf": str(t.amount_rwf),
                    "method":     t.method,
                    "status":     t.status,
                    "created_at": t.created_at,
                }
                for t in transactions
            ],
        })

    def patch(self, request, pk):
        try:
            u = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        is_active = request.data.get("is_active")
        if is_active is not None:
            u.is_active = is_active
            u.save()

        return Response({
            "detail":    "User updated.",
            "is_active": u.is_active,
        })


class AdminResetUserPasswordView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            u = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        import secrets, string
        temp_password = "".join(
            secrets.choice(string.ascii_letters + string.digits)
            for _ in range(10)
        )
        u.set_password(temp_password)
        u.save()

        # Email temp password to user
        try:
            send_mail(
                subject="Your IngufuPay password has been reset",
                message=(
                    f"Hi {u.username},\n\n"
                    f"Your password has been reset by an administrator.\n\n"
                    f"Temporary Password: {temp_password}\n\n"
                    f"Please log in and change your password immediately.\n"
                    f"— IngufuPay Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[u.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({
            "detail":        "Password reset successfully.",
            "temp_password": temp_password,
        })


# ── All Meters ────────────────────────────────────────────────────────────────
class AdminMeterListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Meter.objects.select_related("owner").order_by("-created_at")

        province = request.query_params.get("province")
        district = request.query_params.get("district")
        status_f = request.query_params.get("status")
        search   = request.query_params.get("search")

        if province:
            qs = qs.filter(province=province)
        if district:
            qs = qs.filter(district=district)
        if status_f:
            qs = qs.filter(status=status_f)
        if search:
            qs = qs.filter(
                Q(meter_number__icontains=search) |
                Q(name__icontains=search) |
                Q(owner__username__icontains=search)
            )

        data = [
            {
                "id":           m.id,
                "meter_number": m.meter_number,
                "name":         m.name,
                "owner":        m.owner.username,
                "owner_id":     m.owner.id,
                "status":       m.status,
                "balance":      str(m.current_balance_units),
                "province":     m.province,
                "district":     m.district,
                "sector":       m.sector,
                "is_low":       m.is_low_balance,
                "last_seen":    m.last_seen,
                "created_at":   m.created_at,
            }
            for m in qs
        ]
        return Response(data)


class AdminMeterDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            m = Meter.objects.get(pk=pk)
        except Meter.DoesNotExist:
            return Response({"detail": "Meter not found."}, status=404)

        if "current_balance_units" in request.data:
            m.current_balance_units = request.data["current_balance_units"]
        if "status" in request.data:
            m.status = request.data["status"]
        m.save()

        return Response({"detail": "Meter updated.", "balance": str(m.current_balance_units)})


class AdminGenerateDeviceTokenView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            m = Meter.objects.get(pk=pk)
        except Meter.DoesNotExist:
            return Response({"detail": "Meter not found."}, status=404)

        import secrets
        token = secrets.token_hex(32)
        m.device_token = token
        m.save()

        return Response({
            "device_token": token,
            "meter_number": m.meter_number,
            "message":      "Copy this token into your ESP32 code.",
        })


# ── All Transactions ──────────────────────────────────────────────────────────
class AdminTransactionListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = PaymentTransaction.objects.select_related(
            "user", "meter"
        ).order_by("-created_at")

        status_f  = request.query_params.get("status")
        method    = request.query_params.get("method")
        from_date = request.query_params.get("from_date")
        to_date   = request.query_params.get("to_date")
        user_id   = request.query_params.get("user_id")
        province  = request.query_params.get("province")
        district  = request.query_params.get("district")

        if status_f:
            qs = qs.filter(status=status_f)
        if method:
            qs = qs.filter(method=method)
        if from_date:
            qs = qs.filter(created_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(created_at__date__lte=to_date)
        if user_id:
            qs = qs.filter(user_id=user_id)
        if province:
            qs = qs.filter(meter__province=province)
        if district:
            qs = qs.filter(meter__district=district)

        data = [
            {
                "id":         str(t.id),
                "user":       t.user.username,
                "meter":      t.meter.meter_number if t.meter else "—",
                "province":   t.meter.province if t.meter else "—",
                "district":   t.meter.district if t.meter else "—",
                "amount_rwf": str(t.amount_rwf),
                "method":     t.method,
                "status":     t.status,
                "token":      t.token_purchase.token_generated if hasattr(t, "token_purchase") else "—",
                "units":      str(t.token_purchase.units_generated) if hasattr(t, "token_purchase") else "—",
                "created_at": t.created_at,
            }
            for t in qs
        ]
        return Response(data)


# ── System Settings ───────────────────────────────────────────────────────────
class AdminSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        settings_qs = SystemSetting.objects.all()
        data = {s.key: s.value for s in settings_qs}
        data.setdefault("unit_price_rwf", "200")
        data.setdefault("low_balance_threshold", "5")
        return Response(data)

    def patch(self, request):
        for key, value in request.data.items():
            SystemSetting.set(key, value, user=request.user)
        return Response({"detail": "Settings updated."})