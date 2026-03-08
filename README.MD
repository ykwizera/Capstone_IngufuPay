# IngufuPay

IngufuPay is a smart electricity token management system designed for the Rwandan market. It allows users to purchase prepaid electricity units, manage multiple meters, monitor real-time power consumption, and receive low balance alerts — all from a single web application. The system integrates directly with IoT hardware (ESP32 microcontroller) so that when a user purchases units on the platform, they are delivered to the physical meter automatically, and remaining units are reported back to the dashboard in real time.

The name "Ingufu" comes from Kinyarwanda, meaning "power" or "strength" — reflecting the goal of giving users full control over their electricity usage.

---

## Author

Yvette Kwizera

---

## Deployed Version

**Frontend:** [https://capstoneingufupay.netlify.app](https://capstoneingufupay.netlify.app)

**Backend API:** [Deployment Link](#)

**Demo video:** https://drive.google.com/file/d/1y8fnAaH4JOxU4RL54BmZZyaKzkPvBowJ/view?usp=sharing

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
git clone https://github.com/your-username/Capstone-draft.git
cd Capstone-draft
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

## Analysis of Results

### What Was Achieved

The core objectives of IngufuPay were fully achieved. The system successfully delivers a complete end-to-end electricity token management solution that covers user authentication, meter management, token purchasing, and real-time IoT integration.

The token purchase flow works as intended. When a user purchases units, the balance is immediately updated in the database and the ESP32 retrieves the new units within 5 seconds through HTTP polling. The relay responds correctly, turning ON when units are available and cutting power automatically when units reach zero. This was tested and verified through both Postman API tests and live hardware testing with the ESP32 and a connected lamp.

Authentication and security objectives were met. The system uses JWT tokens with a 30-minute access token lifetime, refresh token rotation, and token blacklisting on logout. Email OTP verification was implemented successfully for both registration and password reset, with all emails delivered through Gmail SMTP.

The dashboard and notifications system works correctly. Remaining units update in real time as the ESP32 reports back every 10 seconds. Low balance alerts are triggered automatically when the meter balance drops below the configured threshold.

### What Was Missed or Partially Achieved

The mobile payment integration with MTN Mobile Money was not fully implemented in this version. The current system simulates a successful payment instead of processing a real MoMo transaction. This was due to the complexity of the MTN MoMo API and the time constraints of the project. The architecture is designed to support this in a future update.

Current sensor calibration presented challenges during hardware testing. The EmonLib library requires precise calibration values for accurate power readings. With the available ACS712 sensor, the readings showed some variance at very low loads such as LED bulbs. This affects the accuracy of unit consumption tracking for small loads, though it performs reliably with larger loads.

Backend deployment encountered Python version compatibility issues on both Railway and Render due to newer Python versions breaking certain dependencies. This was resolved by pinning the Python version to 3.11 in `runtime.txt`.

---

## Discussion

### Importance of Milestones

The project was structured around three key milestones that each built on the previous one.

The first milestone was building a functional authentication and meter management system. This was critical because every other feature depends on users being able to securely register, verify their identity, and manage their meters. Without a solid foundation here, the IoT integration would have been impossible to secure properly.

The second milestone was the token purchase flow and transaction history. This is the core business logic of the system. Getting the relationship between payments, tokens, and meter balances correct required careful design of the database models and serializers. The decision to use a OneToOne relationship between transactions and token purchases was important for ensuring data integrity.

The third and most significant milestone was the ESP32 integration. This transformed IngufuPay from a simple web application into a real IoT system. The HTTP polling approach proved more reliable than MQTT for this use case because it does not require a separate broker and works well within the 5-second polling interval. The device token authentication system ensures that each ESP32 can only access its own meter, which is important for security in a multi-user environment.

### Impact of Results

The results demonstrate that a low-cost IoT solution using an ESP32 and a relay can be effectively integrated with a modern web application to deliver smart prepaid electricity management. The total hardware cost per meter is significantly lower than commercial smart meter solutions available in the Rwandan market.

The system proved to be responsive and stable during testing. The 5-second polling interval provides a good balance between responsiveness and server load. For a production deployment serving many meters simultaneously, this interval could be adjusted per meter based on the server capacity.

---

## Recommendations

### For the Community

Electricity management is a real problem in Rwanda and across Africa where prepaid meters are the standard. IngufuPay demonstrates that it is possible to build a low-cost smart metering solution using affordable hardware and open-source software. Community organizations, cooperatives, and small landlords managing multiple rental units could benefit significantly from a system like this without needing to invest in expensive commercial smart meters.

It is recommended that developers building similar systems consider HTTP polling over MQTT for simpler deployments, as it reduces infrastructure complexity and is easier to debug. The ESP32 is well-suited for this type of application given its built-in WiFi, low cost, and wide availability in Rwanda.

### Future Work

The following features are recommended for future development of IngufuPay:

MTN Mobile Money integration should be the first priority. Rwanda has one of the highest mobile money penetration rates in Africa and the majority of electricity purchases happen via MoMo. Integrating the MTN MoMo API would make IngufuPay fully functional as a commercial product.

A mobile application built with React Native would significantly improve accessibility. Most users in Rwanda access the internet primarily through mobile phones and a dedicated mobile app would provide a better experience than a mobile browser.

SMS notifications via a service such as Africa's Talking would ensure users receive low balance alerts even without an internet connection, which is important for reliability in areas with intermittent connectivity.

Multi-tariff support would allow the system to apply different rates at different times of day, enabling time-of-use pricing which can help users reduce their electricity costs by shifting consumption to off-peak hours.

Over-the-air firmware updates for the ESP32 would allow the system to push improvements to deployed devices without requiring physical access, which is essential for managing a large number of meters across different locations.

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