from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

CATEGORY_CHOICES = [
    ("residential",      "Residential (Household)"),
    ("non_residential",  "Non-Residential"),
    ("health",           "Health Facility"),
    ("school",           "School / Higher Learning Institution"),
    ("hotel_small",      "Hotel (annual consumption < 660,000 kWh)"),
    ("hotel_large",      "Hotel (annual consumption >= 660,000 kWh)"),
    ("commercial",       "Commercial / Data Centre"),
    ("water_pumping",    "Water Pumping Station"),
    ("water_treatment",  "Water Treatment Plant"),
    ("telecom",          "Telecom Tower"),
    ("industry_small",   "Industry - Small (5,000-100,000 kWh/yr)"),
    ("industry_medium",  "Industry - Medium (100,000-1,000,000 kWh/yr)"),
    ("industry_large",   "Industry - Large (>=1,000,000 kWh/yr)"),
]


class Meter(models.Model):
    class Status(models.TextChoices):
        ACTIVE   = "active",   "Active"
        INACTIVE = "inactive", "Inactive"
        DISABLED = "disabled", "Disabled"

    owner        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="meters"
    )
    meter_number = models.CharField(max_length=30, unique=True)
    name         = models.CharField(max_length=100)
    location     = models.CharField(max_length=255, blank=True, null=True)
    category     = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="residential",
        help_text="REG tariff category — determines price per kWh"
    )

    # Rwanda location fields
    province = models.CharField(max_length=50, blank=True)
    district = models.CharField(max_length=50, blank=True)
    sector   = models.CharField(max_length=50, blank=True)
    cell     = models.CharField(max_length=50, blank=True)
    village  = models.CharField(max_length=50, blank=True)

    status                = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE
    )
    low_balance_threshold = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=5, validators=[MinValueValidator(0)]
    )
    current_balance_units = models.DecimalField(
        max_digits=12, decimal_places=3,
        default=0, validators=[MinValueValidator(0)]
    )

    # ESP32 integration fields
    device_id    = models.CharField(max_length=100, blank=True, null=True, unique=True)
    device_token = models.CharField(max_length=64,  blank=True, null=True)
    last_seen    = models.DateTimeField(blank=True,  null=True)

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
        if self.low_balance_threshold <= 0:
            return False
        return self.current_balance_units <= self.low_balance_threshold


# ── Province prefix map ───────────────────────────────────────────────────────
PROVINCE_PREFIX = {
    "Kigali City": "KGL",
    "Northern":    "NTH",
    "Southern":    "STH",
    "Eastern":     "EST",
    "Western":     "WST",
}


class MeterRequest(models.Model):
    class Status(models.TextChoices):
        PENDING  = "pending",  "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class Reason(models.TextChoices):
        NEW_CONNECTION = "new_connection", "New Connection"
        REPLACEMENT    = "replacement",    "Replacement"
        ADDITIONAL     = "additional",     "Additional Meter"
        OTHER          = "other",          "Other"

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="meter_requests"
    )
    full_name  = models.CharField(max_length=150)
    id_number  = models.CharField(max_length=20)
    meter_name = models.CharField(max_length=100, blank=True, default="My Meter")
    category   = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="residential",
        help_text="REG tariff category"
    )
    reason     = models.CharField(
        max_length=20, choices=Reason.choices, default=Reason.NEW_CONNECTION
    )
    reason_details = models.TextField(blank=True)

    # Rwanda location
    province = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    sector   = models.CharField(max_length=50)
    cell     = models.CharField(max_length=50)
    village  = models.CharField(max_length=50)

    status           = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    rejection_reason = models.TextField(blank=True)

    # Set when approved
    meter = models.OneToOneField(
        Meter,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="request"
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="reviewed_requests"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status"]),
            models.Index(fields=["province"]),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.province} [{self.status}]"

    def assign_meter_number(self):
        prefix = PROVINCE_PREFIX.get(self.province, "RWA")
        last = Meter.objects.filter(
            meter_number__startswith=prefix
        ).order_by("-meter_number").first()

        if last:
            try:
                seq = int(last.meter_number.split("-")[1]) + 1
            except (IndexError, ValueError):
                seq = 1
        else:
            seq = 1

        return f"{prefix}-{seq:03d}"


# ── System settings ───────────────────────────────────────────────────────────
class SystemSetting(models.Model):
    key        = models.CharField(max_length=100, unique=True)
    value      = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    class Meta:
        ordering = ["key"]

    def __str__(self):
        return f"{self.key} = {self.value}"

    @classmethod
    def get(cls, key, default=None):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set(cls, key, value, user=None):
        obj, _ = cls.objects.update_or_create(
            key=key,
            defaults={"value": str(value), "updated_by": user}
        )
        return obj