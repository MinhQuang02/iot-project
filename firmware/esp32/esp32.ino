#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

#include "wifi_setup.h"
#include "servo_setup.h"
#include "dht_setup.h"
#include "lcd_setup.h"   // NEW
#include "rfid_setup.h"  // NEW

// ===========================
// MQTT CONFIG (HiveMQ Cloud)
// ===========================
const char* MQTT_SERVER   = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud";
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "pqminh";
const char* MQTT_PASS     = "pKH478Dyjpc6fW@";

// Servo topics
const char* SERVO_CMD_TOPIC    = "smart_greenhouse/door/cmd";
const char* SERVO_STATUS_TOPIC = "smart_greenhouse/door/status";

// DHT topic
const char* MQTT_TOPIC_DHT  = "sensors/temperature_humidity/readings";

// RFID topic (từ code bạn bạn)
const char* MQTT_TOPIC_RFID = "greenhouse/rfid/scan";

// LCD topic (nhận message hiển thị – giữ đúng tên code bạn)
const char* MQTT_TOPIC_LCD_MESSAGE = "greenhouse/lcd/message";

// ===========================
// MQTT CLIENT
// ===========================
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// Servo (from servo_setup.h)
DoorServo doorServo;

// LCD & RFID objects (dùng trong các header)
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);
MFRC522           rfid(RFID_SS_PIN, RFID_RST_PIN);

// ===========================
// MQTT CALLBACK
// ===========================
void mqttCallback(char* topic, byte* payload, unsigned int len) {
  String msg;
  for (int i = 0; i < (int)len; i++) {
    msg += (char)payload[i];
  }

  Serial.print("\n[MESSAGE] ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(msg);

  // 1. Lệnh điều khiển cửa (JSON) cho servo
  if (String(topic) == SERVO_CMD_TOPIC) {
    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, msg)) {
      Serial.println("JSON parse error");
      return;
    }

    String action = doc["action"] | "";
    action.toLowerCase();

    if (action == "open") {
      Serial.println(">> Command: OPEN");
      doorServo.openDoor();
      mqttClient.publish(SERVO_STATUS_TOPIC, "OPENED");
    } else if (action == "close") {
      Serial.println(">> Command: CLOSE");
      doorServo.closeDoor();
      mqttClient.publish(SERVO_STATUS_TOPIC, "CLOSED");
    } else {
      Serial.println("Unknown action");
    }
  }

  // 2. Tin nhắn hiển thị LCD từ Web
  if (String(topic) == MQTT_TOPIC_LCD_MESSAGE) {
    lcdShowMessageFromWeb(msg);   // logic hiển thị giống code bạn
  }
}

// ===========================
// MQTT RECONNECT
// ===========================
void mqttReconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting MQTT...");

    String clientId = "ESP-MAIN-" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected!");
      // Subscribe servo
      mqttClient.subscribe(SERVO_CMD_TOPIC);
      Serial.print("Subscribed: ");
      Serial.println(SERVO_CMD_TOPIC);

      // Subscribe nhận message LCD
      mqttClient.subscribe(MQTT_TOPIC_LCD_MESSAGE);
      Serial.print("Subscribed: ");
      Serial.println(MQTT_TOPIC_LCD_MESSAGE);

    } else {
      Serial.print("fail rc=");
      Serial.print(mqttClient.state());
      Serial.println(" -> retry in 3s");
      delay(3000);
    }
  }
}

// ===========================
// SETUP
// ===========================
unsigned long lastSensor = 0;
const long SENSOR_INTERVAL = 5000; // 5s

void setup() {
  Serial.begin(115200);
  delay(1000);

  // 0. LCD
  lcdSetup();  // màn hình chào + backlight

  // 1. Servo
  doorServo.begin();
  Serial.println("Servo initialized (door CLOSED).");

  // 2. WiFi (WiFiManager trên sản phẩm thật)
  wifiSetup();

  // 3. NTP time (cho timestamp DHT)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Waiting for NTP time sync...");
  while (time(nullptr) < 100000) {
    delay(200);
    Serial.print(".");
  }
  Serial.println("\nTime synced!");

  // 4. DHT
  dhtSetup();

  // 5. RFID
  rfidSetup();

  // 6. MQTT
  espClient.setInsecure();  // TLS nhưng bỏ kiểm tra cert cho tiện demo
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  // Màn hình chờ mặc định cho LCD
  lcdShowDefaultScreen();

  Serial.println("System ready (WiFi + MQTT + Servo + DHT + RFID + LCD).");
}

// ===========================
// LOOP
// ===========================
void loop() {
  if (!mqttClient.connected()) {
    mqttReconnect();
  }
  mqttClient.loop();

  unsigned long now = millis();

  // Publish DHT data every 5s
  if (now - lastSensor > SENSOR_INTERVAL) {
    lastSensor = now;
    publishDHT();
  }

  // Xử lý RFID liên tục (quét -> LCD -> MQTT)
  handleRFID();
}
