from django.urls import path
from .views import (
    MeterListCreateView,
    MeterDetailView,
    MeterGenerateDeviceTokenView,
    ESP32ReportView,
    ESP32PollView,
)

app_name = "meters"

urlpatterns = [
    path("",                               MeterListCreateView.as_view(),         name="meter-list-create"),
    path("<int:pk>/",                      MeterDetailView.as_view(),             name="meter-detail"),
    path("<int:pk>/generate-device-token/", MeterGenerateDeviceTokenView.as_view(), name="generate-device-token"),
    path("esp32/report/",                  ESP32ReportView.as_view(),             name="esp32-report"),
    path("esp32/poll/",                    ESP32PollView.as_view(),               name="esp32-poll"),
]