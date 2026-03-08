from django.urls import path
from .views import SupportRequestView

app_name = "support"

urlpatterns = [
    path("", SupportRequestView.as_view(), name="support-request"),
]