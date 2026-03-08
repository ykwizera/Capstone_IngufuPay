import uuid
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.conf import settings
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN    = 'admin',    'Admin'
        CUSTOMER = 'customer', 'Customer'

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be in format: '+999999999'. Up to 15 digits."
    )

    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.CUSTOMER
    )
    phone_number = models.CharField(
        validators=[phone_regex], max_length=15,
        unique=True, null=True, blank=True
    )
    avatar          = models.ImageField(upload_to="avatars/", blank=True, null=True)
    province        = models.CharField(max_length=50, blank=True)
    district        = models.CharField(max_length=50, blank=True)
    sector          = models.CharField(max_length=50, blank=True)
    cell            = models.CharField(max_length=50, blank=True)
    village         = models.CharField(max_length=50, blank=True)
    address_details = models.TextField(blank=True)

    # Email verification
    is_email_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER


class EmailVerificationOTP(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_otps"
    )
    code_hash  = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)
    attempts   = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"EmailOTP for {self.user} - used={self.is_used}"


class PasswordResetOTP(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_otps"
    )
    code_hash  = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)
    attempts   = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user", "is_used"]),
            models.Index(fields=["expires_at"]),
        ]

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"OTP for {self.user} - used={self.is_used}"