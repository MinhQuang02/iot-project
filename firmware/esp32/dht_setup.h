#pragma once

#include <DHT.h>
#include <ArduinoJson.h>
#include <time.h>
#include <PubSubClient.h>

// DHT11: đấu DATA vào GPIO4, VCC 3.3V, GND
#define DHT_PIN   4
#define DHT_TYPE  DHT11

// Hai biến này được định nghĩa trong .ino
extern const char* MQTT_TOPIC_DHT;
extern PubSubClient mqttClient;

DHT dht(DHT_PIN, DHT_TYPE);

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
}
