#pragma once

#include <DHT.h>
#include <ArduinoJson.h>
#include <time.h>
#include <PubSubClient.h>
#include <WiFi.h>

// DHT11: đấu DATA vào GPIO4, VCC 3.3V, GND
#define DHT_PIN   4
#define DHT_TYPE  DHT11

// Hai biến này được định nghĩa trong .ino
extern const char* MQTT_TOPIC_DHT;
extern PubSubClient mqttClient;

DHT dht(DHT_PIN, DHT_TYPE);

// ======================
// THINGSPEAK CONFIG
// ======================
const char* TS_HOST      = "api.thingspeak.com";
const int   TS_PORT      = 80;  // dùng HTTP, không cần SSL cho demo
const char* TS_WRITE_KEY = "UYDPTI3DGKAME2BD"; // <- sửa thành key của bạn

// Biến thời gian cho ThingSpeak
unsigned long lastThingSpeak = 0;
const unsigned long TS_INTERVAL = 20000; // 20s

WiFiClient tsClient;  // client thường để gửi HTTP request

void sendToThingSpeak(float t, float h) {
  unsigned long now = millis();
  if (now - lastThingSpeak < TS_INTERVAL) {
    return;  // chưa đến lúc gửi, tránh vượt rate limit
  }
  lastThingSpeak = now;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[TS] WiFi not connected, skip.");
    return;
  }

  if (!tsClient.connect(TS_HOST, TS_PORT)) {
    Serial.println("[TS] Connection failed");
    return;
  }

  // Chuẩn bị đường dẫn với API key & fields
  String url = "/update?api_key=";
  url += TS_WRITE_KEY;
  url += "&field1=";
  url += String(t, 2);
  url += "&field2=";
  url += String(h, 2);

  // Gửi HTTP GET
  String request =
    String("GET ") + url + " HTTP/1.1\r\n" +
    "Host: " + TS_HOST + "\r\n" +
    "Connection: close\r\n\r\n";

  tsClient.print(request);

  Serial.print("[TS] Request: ");
  Serial.println(url);

  // Đọc response (không bắt buộc, đọc sơ cho biết)
  while (tsClient.connected() || tsClient.available()) {
    if (tsClient.available()) {
      String line = tsClient.readStringUntil('\n');
      // Nếu muốn debug thì in line ra, còn không có thể bỏ
      // Serial.println(line);
    }
  }

  tsClient.stop();
  Serial.println("[TS] Done send.");
}

String sensor_getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00+00:00";
  }
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S+00:00", &timeinfo);
  return String(buf);
}

void dhtSetup() {
  dht.begin();
  Serial.println("DHT11 initialized.");
}

void publishDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("DHT read failed!");
    return;
  }

  JsonDocument doc;
  doc["temperature"] = t;
  doc["humidity"]    = h;
  doc["timestamp"]   = sensor_getTimestamp();

  char buf[256];
  serializeJson(doc, buf);

  mqttClient.publish(MQTT_TOPIC_DHT, buf);

  Serial.print("DHT Published: ");
  Serial.println(buf);

  sendToThingSpeak(t, h);
}
