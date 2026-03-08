from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer
from ingufupay.pagination import StandardPagination


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        is_read = request.query_params.get("is_read")
        if is_read is not None:
            val = is_read.strip().lower()
            if val in {"true", "1", "yes"}:
                qs = qs.filter(is_read=True)
            elif val in {"false", "0", "no"}:
                qs = qs.filter(is_read=False)

        paginator  = StandardPagination()
        result     = paginator.paginate_queryset(qs, request)
        serializer = NotificationSerializer(result, many=True)
        response   = paginator.get_paginated_response(serializer.data)

        response.data["unread_count"] = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return response


class NotificationDetailView(APIView):
    """PATCH /api/notifications/<id>/ — mark read or unread"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        is_read = request.data.get("is_read")
        if is_read is None:
            return Response(
                {"detail": "is_read field is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        notification.is_read = bool(is_read)
        notification.save(update_fields=["is_read"])
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/ — mark all as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {"detail": "All notifications marked as read.", "updated_count": updated},
            status=status.HTTP_200_OK
        )

    # Also support PATCH in case frontend uses it
    def patch(self, request):
        return self.post(request)