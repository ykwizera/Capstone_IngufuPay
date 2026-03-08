from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Meter(models.Model):
    class Status(models.TextChoices):
        ACTIVE   = "active",   "Active"
        INACTIVE = "inactive", "Inactive"
        DISABLED = "disabled", "Disabled"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="meters"
    )
    meter_number          = models.CharField(max_length=30, unique=True)
    name                  = models.CharField(max_length=100)
    location              = models.CharField(max_length=255, blank=True, null=True)
    status                = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    low_balance_threshold = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=5,
        validators=[MinValueValidator(0)]
    )
    current_balance_units = models.DecimalField(
        max_digits=12, decimal_places=3,
        default=0,
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"],
                name="unique_meter_name_per_owner"
            )
        ]
        indexes = [
            models.Index(fields=["owner"]),
            models.Index(fields=["status"]),
            models.Index(fields=["owner", "status"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.meter_number}"

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE

    @property
    def is_low_balance(self):
        # Only flag low balance if threshold is above 0 and balance is at or below it
        if self.low_balance_threshold <= 0:
            return False
        return self.current_balance_units <= self.low_balance_threshold