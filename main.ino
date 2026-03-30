#define BLYNK_TEMPLATE_ID   "TMPL2BTK07AtK"
#define BLYNK_TEMPLATE_NAME "Energy Meter"
#define BLYNK_AUTH_TOKEN    "VFBS_YwSrhWLu_KqC2nWPHE3xgiTJrXx"
#define BLYNK_PRINT         Serial

#include <EmonLib.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>

EnergyMonitor emon;
BlynkTimer timer;

// ── WiFi ──────────────────────────────────────────────────────────────────────
char ssid[] = "CANALBOX-AB50-2G";
char pass[] = "DxJyYUUkHJtt";
char auth[] = BLYNK_AUTH_TOKEN;

// ── IngufuPay config ──────────────────────────────────────────────────────────
const char* INGUFUPAY_HOST = "http://192.168.1.141:8000";
const char* METER_NUMBER   = "KGL-003";
const char* DEVICE_TOKEN   = "1b2e5de189c4bc57e0de3e87d3e85166cf77d64cc712a3fe3a38a106f8658cd5";

// ── Hardware ──────────────────────────────────────────────────────────────────
#define vCalibration    106.8
#define currCalibration 1.5
#define RELAY_PIN       25

// ── State ─────────────────────────────────────────────────────────────────────
float purchasedUnits  = 0.0;
float usedKWh         = 0.0;
float remainingUnits  = 0.0;
unsigned long lastMillis       = 0;
unsigned long lastPollMillis   = 0;
unsigned long lastReportMillis = 0;

const float MIN_VOLTAGE = 10.0;
const float MIN_CURRENT = 0.001;
const float MIN_POWER   = 0.5;

const unsigned long POLL_INTERVAL   = 5000;   // poll Django every 5s
const unsigned long REPORT_INTERVAL = 10000;  // report remaining every 10s

// ── Relay ─────────────────────────────────────────────────────────────────────
void updateRelay() {
  if (remainingUnits <= 0.0) {
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("Relay OFF - no units");
  } else {
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("Relay ON");
  }
}

// ── Poll Django for purchased units ──────────────────────────────────────────
void pollIngufuPay() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(INGUFUPAY_HOST) +
               "/api/meters/esp32/poll/?meter_number=" +
               METER_NUMBER +
               "&device_token=" +
               DEVICE_TOKEN;

  http.begin(url);
  int code = http.GET();

  if (code == 200) {
    String body = http.getString();
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, body) == DeserializationError::Ok) {
      float serverUnits = doc["purchased_units"].as<float>();

      if (serverUnits > purchasedUnits) {
        float added    = serverUnits - purchasedUnits;
        purchasedUnits = serverUnits;
        Serial.printf("New units received: +%.3f  Total: %.3f\n", added, purchasedUnits);
      }

      remainingUnits = purchasedUnits - usedKWh;
      if (remainingUnits < 0) remainingUnits = 0;
      updateRelay();
    }
  } else {
    Serial.printf("Poll failed: HTTP %d\n", code);
  }
  http.end();
}

// ── Report remaining units to Django ─────────────────────────────────────────
void reportToIngufuPay() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(INGUFUPAY_HOST) + "/api/meters/esp32/report/";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"meter_number\":\"" + String(METER_NUMBER) +
                "\",\"device_token\":\"" + String(DEVICE_TOKEN) +
                "\",\"remaining_units\":" + String(remainingUnits, 3) + "}";

  int code = http.POST(body);
  if (code == 200) {
    Serial.printf("Reported remaining: %.3f units\n", remainingUnits);
  } else {
    Serial.printf("Report failed: HTTP %d\n", code);
  }
  http.end();
}

// ── Energy sensing ────────────────────────────────────────────────────────────
void sendSensor() {
  emon.calcVI(20, 2000);

  float voltage = emon.Vrms;
  float current = emon.Irms;
  float power   = emon.apparentPower;

  if (!isfinite(voltage) || voltage < 0) voltage = 0;
  if (!isfinite(current) || current < 0) current = 0;
  if (!isfinite(power)   || power   < 0) power   = 0;

  if (voltage < MIN_VOLTAGE) voltage = 0;
  if (current < MIN_CURRENT) current = 0;
  if (power   < MIN_POWER)   power   = 0;
  if (current == 0)          power   = 0;

  unsigned long now = millis();
  if (lastMillis == 0) lastMillis = now;
  float elapsedHours = (now - lastMillis) / 3600000.0;
  if (power > 0) usedKWh += (power * elapsedHours) / 1000.0;
  lastMillis = now;

  remainingUnits = purchasedUnits - usedKWh;
  if (remainingUnits < 0) remainingUnits = 0;

  updateRelay();

  Serial.printf("V:%.2f  I:%.4f  P:%.2f  Used:%.6fkWh  Rem:%.4f units\n",
                voltage, current, power, usedKWh, remainingUnits);

  Blynk.virtualWrite(V0, voltage);
  Blynk.virtualWrite(V1, current);
  Blynk.virtualWrite(V2, power);
  Blynk.virtualWrite(V3, remainingUnits);
  Blynk.virtualWrite(V4, usedKWh);

  // Poll and report on their own intervals
  unsigned long nowMs = millis();
  if (nowMs - lastPollMillis >= POLL_INTERVAL) {
    lastPollMillis = nowMs;
    pollIngufuPay();
  }
  if (nowMs - lastReportMillis >= REPORT_INTERVAL) {
    lastReportMillis = nowMs;
    reportToIngufuPay();
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("Relay starts LOW (OFF)");

  emon.voltage(35, vCalibration, 1.7);
  emon.current(34, currCalibration);

  WiFi.begin(ssid, pass);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected — IP: " + WiFi.localIP().toString());

  Blynk.config(auth);
  Blynk.connect();
  Serial.println(Blynk.connected() ? "Blynk connected" : "Blynk not connected");

  // Get initial units from Django on boot
  pollIngufuPay();

  timer.setInterval(2000L, sendSensor);
  Serial.println("Setup complete");
}

void loop() {
  Blynk.run();
  timer.run();
}