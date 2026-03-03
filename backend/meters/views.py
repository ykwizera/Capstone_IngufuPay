from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Meter
from .serializers import MeterSerializer, MeterCreateSerializer, MeterUpdateSerializer
from ingufupay.pagination import StandardPagination  # ✅ added


class MeterListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/meters/ — list authenticated user's meters"""
        meters = Meter.objects.filter(owner=request.user)
        paginator = StandardPagination()                          # ✅ added
        result = paginator.paginate_queryset(meters, request)     # ✅ added
        serializer = MeterSerializer(result, many=True)           # ✅ result not meters
        return paginator.get_paginated_response(serializer.data)  # ✅ added

    def post(self, request):
        """POST /api/meters/ — register a new meter"""
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
        """GET /api/meters/<id>/ — meter details"""
        meter = self.get_object(pk, request.user)
        serializer = MeterSerializer(meter)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        """PATCH /api/meters/<id>/ — update name, location, threshold, or status"""
        meter = self.get_object(pk, request.user)
        serializer = MeterUpdateSerializer(meter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        meter = serializer.save()
        return Response(MeterSerializer(meter).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """DELETE /api/meters/<id>/ — set meter inactive instead of hard delete"""
        meter = self.get_object(pk, request.user)
        meter.status = Meter.Status.INACTIVE
        meter.save(update_fields=["status", "updated_at"])
        return Response(
            {"detail": "Meter deactivated successfully."},
            status=status.HTTP_200_OK
        )