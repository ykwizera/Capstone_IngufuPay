from django.urls import path
from .views import PurchaseTokenView, TransactionListView, TransactionDetailView

app_name = "transactions"

urlpatterns = [
    path("",                TransactionListView.as_view(),   name="transaction-list"),
    path("<int:pk>/",       TransactionDetailView.as_view(), name="transaction-detail"),
    path("purchase-token/", PurchaseTokenView.as_view(),     name="purchase-token"),
]