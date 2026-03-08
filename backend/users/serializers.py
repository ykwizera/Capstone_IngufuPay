from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import PasswordResetOTP, EmailVerificationOTP
from .utils import generate_otp, hash_otp, verify_otp, otp_expiry, send_otp_email

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ("username", "email", "phone_number", "password", "role")
        extra_kwargs = {"role": {"read_only": True}}

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        # Create account with is_active=False until email verified
        user = User.objects.create_user(**validated_data)
        user.is_active         = False
        user.is_email_verified = False
        user.save(update_fields=["is_active", "is_email_verified"])

        # Send verification OTP
        code = generate_otp()
        EmailVerificationOTP.objects.create(
            user=user,
            code_hash=hash_otp(code),
            expires_at=otp_expiry(10),
        )
        send_verification_email(user.email, code)
        return user


def send_verification_email(email, code):
    from django.core.mail import send_mail
    from django.conf import settings
    send_mail(
        subject="Verify your IngufuPay email",
        message=(
            f"Welcome to IngufuPay!\n\n"
            f"Your email verification code is: {code}\n\n"
            f"This code expires in 10 minutes.\n\n"
            f"If you did not create an account, ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp   = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or OTP.")

        if user.is_email_verified:
            raise serializers.ValidationError("This email is already verified.")

        otp_obj = (
            EmailVerificationOTP.objects
            .filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            raise serializers.ValidationError("Invalid email or OTP.")
        if otp_obj.is_expired():
            raise serializers.ValidationError("OTP has expired. Request a new one.")
        if otp_obj.attempts >= 5:
            raise serializers.ValidationError("Too many attempts. Request a new OTP.")
        if not verify_otp(attrs["otp"], otp_obj.code_hash):
            otp_obj.attempts += 1
            otp_obj.save(update_fields=["attempts"])
            raise serializers.ValidationError("Invalid OTP code.")

        self.context["user"]    = user
        self.context["otp_obj"] = otp_obj
        return attrs

    def save(self):
        user    = self.context["user"]
        otp_obj = self.context["otp_obj"]
        user.is_active         = True
        user.is_email_verified = True
        user.save(update_fields=["is_active", "is_email_verified"])
        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")
        if user.is_email_verified:
            raise serializers.ValidationError("This email is already verified.")
        self.context["user"] = user
        return value

    def save(self):
        user = self.context["user"]
        code = generate_otp()
        EmailVerificationOTP.objects.create(
            user=user,
            code_hash=hash_otp(code),
            expires_at=otp_expiry(10),
        )
        send_verification_email(user.email, code)


class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model  = User
        fields = (
            "id", "username", "email", "phone_number", "role",
            "is_active", "is_email_verified", "date_joined", "last_login",
            "avatar",
            "province", "district", "sector", "cell", "village", "address_details",
        )
        read_only_fields = (
            "id", "role", "is_active", "is_email_verified", "date_joined", "last_login"
        )

    def update(self, instance, validated_data):
        avatar = validated_data.pop("avatar", None)
        if avatar:
            instance.avatar = avatar
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password     = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address.")
        if not user.is_email_verified:
            raise serializers.ValidationError("This account has not been verified yet.")
        self.context["user"] = user
        return value

    def save(self):
        user = self.context["user"]
        code = generate_otp()
        PasswordResetOTP.objects.create(
            user=user,
            code_hash=hash_otp(code),
            expires_at=otp_expiry(10),
        )
        send_otp_email(user.email, code)


class ConfirmPasswordResetSerializer(serializers.Serializer):
    email        = serializers.EmailField()
    otp          = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(min_length=8, max_length=128)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or OTP.")

        otp_obj = (
            PasswordResetOTP.objects
            .filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            raise serializers.ValidationError("Invalid email or OTP.")
        if otp_obj.is_expired():
            raise serializers.ValidationError("OTP has expired. Request a new one.")
        if otp_obj.attempts >= 5:
            raise serializers.ValidationError("Too many attempts. Request a new OTP.")
        if not verify_otp(attrs["otp"], otp_obj.code_hash):
            otp_obj.attempts += 1
            otp_obj.save(update_fields=["attempts"])
            raise serializers.ValidationError("Invalid OTP code.")

        self.context["user"]    = user
        self.context["otp_obj"] = otp_obj
        return attrs

    def save(self):
        user    = self.context["user"]
        otp_obj = self.context["otp_obj"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])