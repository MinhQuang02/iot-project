#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const char* mqtt_server = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "pqminh";
const char* mqtt_pass = "pKH478Dyjpc6fW@";
const char* mqtt_topic = "sensors/mock/readings";

unsigned long lastMsg = 0;
const long interval = 5000;
const char* ACTIONS[] = {"calibrate", "set_value", "reset_status", "check_firmware"};

WiFiClientSecure espClient;
PubSubClient client(espClient);

String getTimestamp() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    return "1970-01-01T00:00:00+00:00";
  }
  char timeStringBuff[30];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%dT%H:%M:%S+00:00", &timeinfo);
  return String(timeStringBuff);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Waiting for time sync...");
  while (time(nullptr) < 100000) {
    delay(100);
    Serial.print(".");
  }
  Serial.println("\nTime synced!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  
  randomSeed(analogRead(0));

  setup_wifi();
  espClient.setInsecure();
  
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    
    const char* random_action = ACTIONS[random(0, 4)];
    float random_value = random(1000, 10000) / 100.0; 
    int random_id = random(100, 999);

    JsonDocument doc;
    doc["command_id"] = random_id;
    doc["action"] = random_action;
    doc["value"] = random_value;
    doc["timestamp"] = getTimestamp();

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    Serial.println("--------------------------------------------------");
    Serial.println("Send command successfully");
    Serial.print("Topic: ");
    Serial.println(mqtt_topic);
    Serial.print("Payload (JSON): ");
    Serial.println(jsonBuffer);
    Serial.println("--------------------------------------------------");

    client.publish(mqtt_topic, jsonBuffer);
  }
}