from django.urls import path
from .admin_views import (
    AdminDashboardView,
    AdminMeterRequestListView,
    AdminMeterRequestDetailView,
    AdminUserListView,
    AdminUserDetailView,
    AdminResetUserPasswordView,
    AdminMeterListView,
    AdminMeterDetailView,
    AdminGenerateDeviceTokenView,
    AdminTransactionListView,
    AdminSettingsView,
)

urlpatterns = [
    # Dashboard
    path("dashboard/",                          AdminDashboardView.as_view()),

    # Meter requests
    path("meter-requests/",                     AdminMeterRequestListView.as_view()),
    path("meter-requests/<int:pk>/review/",     AdminMeterRequestDetailView.as_view()),

    # Users
    path("users/",                              AdminUserListView.as_view()),
    path("users/<int:pk>/",                     AdminUserDetailView.as_view()),
    path("users/<int:pk>/reset-password/",      AdminResetUserPasswordView.as_view()),

    # Meters
    path("meters/",                             AdminMeterListView.as_view()),
    path("meters/<int:pk>/",                    AdminMeterDetailView.as_view()),
    path("meters/<int:pk>/generate-token/",     AdminGenerateDeviceTokenView.as_view()),

    # Transactions
    path("transactions/",                       AdminTransactionListView.as_view()),

    # Settings
    path("settings/",                           AdminSettingsView.as_view()),
]