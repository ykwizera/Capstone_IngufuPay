from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Meter
from .serializers import MeterSerializer, MeterCreateSerializer, MeterUpdateSerializer
from ingufupay.pagination import StandardPagination


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