from django.contrib import admin
from .models import SupportRequest


@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display  = ("subject", "category", "user", "status", "created_at")
    list_filter   = ("status", "category")
    search_fields = ("subject", "user__email", "user__username")
    ordering      = ("-created_at",)