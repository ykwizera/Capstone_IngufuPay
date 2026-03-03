from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer
from ingufupay.pagination import StandardPagination  # ✅ added


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        # ✅ robust is_read filter
        is_read = request.query_params.get("is_read")
        if is_read is not None:
            val = is_read.strip().lower()
            truthy = {"true", "1", "yes", "y"}
            falsy = {"false", "0", "no", "n"}
            if val in truthy:
                qs = qs.filter(is_read=True)
            elif val in falsy:
                qs = qs.filter(is_read=False)

        paginator = StandardPagination()
        result = paginator.paginate_queryset(qs, request)
        serializer = NotificationSerializer(result, many=True)
        response = paginator.get_paginated_response(serializer.data)

        # ✅ inject unread count for frontend badge
        response.data["unread_count"] = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return response


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])  # ✅ track when read
        return Response({"detail": "Marked as read."}, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {
                "detail": "All notifications marked as read.",
                "updated_count": updated  # ✅ how many were updated
            },
            status=status.HTTP_200_OK
        )