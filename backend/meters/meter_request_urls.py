from django.urls import path
from .meter_request_views import MeterRequestListCreateView, MeterRequestDetailView

urlpatterns = [
    path("",          MeterRequestListCreateView.as_view()),
    path("<int:pk>/", MeterRequestDetailView.as_view()),
]