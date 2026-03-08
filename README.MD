# IngufuPay

IngufuPay is a smart electricity token management system designed for the Rwandan market. It allows users to purchase prepaid electricity units, manage multiple meters, monitor real-time power consumption, and receive low balance alerts — all from a single web application. The system integrates directly with IoT hardware (ESP32 microcontroller) so that when a user purchases units on the platform, they are delivered to the physical meter automatically, and remaining units are reported back to the dashboard in real time.

The name "Ingufu" comes from Kinyarwanda, meaning "power" or "strength" — reflecting the goal of giving users full control over their electricity usage.

---

## Author

Yvette Kwizera

---

## Deployed Version

[Deployment Link](#)

---

## Tech Stack

**Backend**
- Python 3.11
- Django 4.2
- Django REST Framework
- PostgreSQL
- Simple JWT (authentication)
- Gmail SMTP (email notifications)
- Whitenoise (static files)
- Gunicorn (production server)

**Frontend**
- React 18 (Vite)
- React Router DOM
- Axios
- Lucide React (icons)
- Recharts (data visualization)

**IoT**
- ESP32 microcontroller
- EmonLib (energy monitoring)
- Blynk (live sensor dashboard)
- ArduinoJson (HTTP communication)

---

## Features

- User registration with email OTP verification
- JWT-based authentication with token refresh and blacklisting
- Add and manage multiple electricity meters
- Purchase electricity tokens with automatic unit delivery to ESP32
- Real-time remaining units reported from ESP32 back to dashboard
- Automatic relay cutoff when units reach zero
- Low balance notifications
- Transaction history
- Support request submission with email notification
- Dark and light mode
- Profile management with avatar upload
- Password reset via OTP

---

## Project Structure

```
Capstone-draft/
  backend/                  Django REST API
    ingufupay/              Project settings and URLs
    users/                  Authentication, registration, profile
    meters/                 Meter management and ESP32 integration
    transactions/           Token purchases and transaction history
    notifications/          In-app notifications
    support/                Support request submissions
    requirements.txt
    Procfile
    nixpacks.toml

  frontend/                 React (Vite) application
    src/
      api/                  Axios configuration
      components/           Layout, Sidebar, Topbar, modals, cards
      context/              Theme context
      pages/                All application pages
      styles/               Global styles
    package.json
```

---

## Installation and Setup

### Prerequisites

Make sure you have the following installed on your machine:

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL
- Git

---

### Step 1 - Clone the repository

```bash
git clone https://github.com/ykwizera/Capstone_IngufuPay.git
```

---

### Step 2 - Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a PostgreSQL database:

```sql
CREATE DATABASE ingufupay_db;
CREATE USER ingufupay_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE ingufupay_db TO ingufupay_user;
```

Update the database credentials in `backend/ingufupay/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'ingufupay_db',
        'USER':     'ingufupay_user',
        'PASSWORD': 'yourpassword',
        'HOST':     'localhost',
        'PORT':     '5432',
    }
}
```

Update the email settings in `settings.py` with your Gmail credentials and App Password:

```python
EMAIL_HOST_USER     = "your.email@gmail.com"
EMAIL_HOST_PASSWORD = "your app password"
DEFAULT_FROM_EMAIL  = "IngufuPay <your.email@gmail.com>"
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create a superuser (optional, for Django admin access):

```bash
python manage.py createsuperuser
```

Start the backend server:

```bash
python manage.py runserver 0.0.0.0:8000
```

The backend will be available at `http://127.0.0.1:8000`

API documentation is available at `http://127.0.0.1:8000/api/docs/`

---

### Step 3 - Frontend Setup

Open a new terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### Step 4 - ESP32 Setup (IoT Integration)

Required Arduino libraries (install via Arduino IDE Library Manager):

- EmonLib
- Blynk
- ArduinoJson 6.x

Open the ESP32 sketch and update the following values:

```cpp
// WiFi credentials
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

// IngufuPay config
const char* INGUFUPAY_HOST = "http://YOUR_PC_IP:8000";
const char* METER_NUMBER   = "YOUR_METER_NUMBER";
const char* DEVICE_TOKEN   = "YOUR_DEVICE_TOKEN";
```

To get the `METER_NUMBER` and `DEVICE_TOKEN`:

1. Register and log in to IngufuPay
2. Add a meter from the Meters page
3. Run the following in the Django shell to generate a device token:

```bash
python manage.py shell
```

```python
from meters.models import Meter
import secrets

meter = Meter.objects.get(id=1)  # replace with your meter id
token = secrets.token_hex(32)
meter.device_token = token
meter.save()

print("METER NUMBER:", meter.meter_number)
print("DEVICE TOKEN:", token)
```

4. Paste both values into the ESP32 code and flash the device

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register/ | Register a new user |
| POST | /api/auth/verify-email/ | Verify email with OTP |
| POST | /api/auth/token/ | Login and get JWT tokens |
| POST | /api/auth/token/refresh/ | Refresh access token |
| GET/PATCH | /api/auth/me/ | Get or update profile |
| POST | /api/auth/change-password/ | Change password |
| POST | /api/auth/password-reset/request-otp/ | Request password reset OTP |
| POST | /api/auth/password-reset/confirm/ | Confirm password reset |
| GET/POST | /api/meters/ | List or create meters |
| GET/PATCH | /api/meters/{id}/ | Get or update a meter |
| POST | /api/meters/{id}/generate-device-token/ | Generate ESP32 device token |
| GET | /api/meters/esp32/poll/ | ESP32 polls for purchased units |
| POST | /api/meters/esp32/report/ | ESP32 reports remaining units |
| GET | /api/transactions/ | List transactions |
| POST | /api/transactions/purchase-token/ | Purchase electricity token |
| GET | /api/notifications/ | List notifications |
| PATCH | /api/notifications/{id}/ | Mark notification as read |
| POST | /api/notifications/mark-all-read/ | Mark all notifications as read |
| POST | /api/support/ | Submit a support request |

---

## IoT Flow

```
User purchases token on IngufuPay
            |
            v
Django adds units to meter balance
            |
            v
ESP32 polls Django every 5 seconds
            |
            v
ESP32 receives updated units
            |
            v
Relay turns ON - power restored
            |
            v
ESP32 measures consumption every 2 seconds
            |
            v
ESP32 reports remaining units to Django every 10 seconds
            |
            v
Dashboard shows live remaining units
            |
            v
When units reach zero - relay cuts power automatically
```

---

## Environment Variables (Production)

For deployment the following environment variables must be set:

```
SECRET_KEY
DEBUG
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
PGDATABASE
PGUSER
PGPASSWORD
PGHOST
PGPORT
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
DEFAULT_FROM_EMAIL
```

---

## License

This project was developed as a capstone project at African Leadership University.