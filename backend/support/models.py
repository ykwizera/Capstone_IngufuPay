from django.db import models
from django.conf import settings


class SupportRequest(models.Model):
    class Status(models.TextChoices):
        OPEN        = "open",        "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        RESOLVED    = "resolved",    "Resolved"
        CLOSED      = "closed",      "Closed"

    user     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="support_requests"
    )
    subject  = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    message  = models.TextField()
    status   = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.status}] {self.subject} — {self.user}"