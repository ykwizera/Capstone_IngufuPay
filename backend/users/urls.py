from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView, TokenBlacklistView,
)
from .views import (
    RegisterView,
    VerifyEmailView,
    ResendVerificationView,
    MeView,
    ChangePasswordView,
    RequestPasswordResetOTPView,
    ConfirmPasswordResetView,
)

app_name = "users"

urlpatterns = [
    path("register/",                   RegisterView.as_view(),               name="register"),
    path("verify-email/",               VerifyEmailView.as_view(),            name="verify-email"),
    path("resend-verification/",        ResendVerificationView.as_view(),     name="resend-verification"),
    path("me/",                         MeView.as_view(),                     name="me"),
    path("change-password/",            ChangePasswordView.as_view(),         name="change-password"),
    path("token/",                      TokenObtainPairView.as_view(),        name="token_obtain_pair"),
    path("token/refresh/",              TokenRefreshView.as_view(),           name="token_refresh"),
    path("token/blacklist/",            TokenBlacklistView.as_view(),         name="token_blacklist"),
    path("password-reset/request-otp/", RequestPasswordResetOTPView.as_view(), name="request-reset-otp"),
    path("password-reset/confirm/",     ConfirmPasswordResetView.as_view(),   name="confirm-reset"),
]