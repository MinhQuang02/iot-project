#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "time.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "mbedtls/base64.h"

#include "wifi_setup.h"   // Dùng chung WiFiManager với node esp32

// --- CẤU HÌNH MQTT GIỐNG ESP32 MAIN ---
// HiveMQ Cloud
const char* MQTT_SERVER = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud";
const int   MQTT_PORT   = 8883;
const char* MQTT_USER   = "pqminh";
const char* MQTT_PASS   = "pKH478Dyjpc6fW@";

// Client ID cố định cho node camera (tránh đụng với ESP32 MAIN)
const char* MQTT_CLIENT_ID = "ESP32_CAM_NODE";

// Topic
const char* TOPIC_LISTEN = "greenhouse/rfid/scan";     // Nghe tín hiệu RFID để chụp
const char* TOPIC_STREAM = "greenhouse/camera/stream"; // Gửi ảnh vào đây

// Cấu hình chân ESP32-CAM AI Thinker
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

WiFiClientSecure espClient;
PubSubClient     client(espClient);

// Forward declaration
void mqttCallback(char* topic, byte* payload, unsigned int length);
void captureAndSend();
void reconnect();

void setup() {
  // Tắt brownout để tránh reset vì sụt áp khi dùng camera
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);
  delay(500);

  // 1. KHỞI TẠO CAMERA
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size   = FRAMESIZE_VGA;   // VGA cho nhẹ mạng
  config.jpeg_quality = 12;
  config.fb_count     = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Loi Camera!");
    return;
  }
  Serial.println("Camera init OK.");

  // 2. KẾT NỐI WIFI QUA WiFiManager (CHUNG VỚI NODE ESP32)
  wifiSetup();               // dùng portal/SSID như trong wifi_setup.h
  WiFi.setSleep(false);      // tránh sleep gây chập chờn khi chụp/gửi ảnh

  // 3. ĐỒNG BỘ THỜI GIAN (NẾU SAU NÀY MUỐN GẮN TIMESTAMP CHO ẢNH)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("NTP Sync");
  while (time(nullptr) < 100000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" OK!");

  // 4. CẤU HÌNH MQTT (CHUNG BROKER VỚI ESP32 MAIN)
  espClient.setInsecure();      // demo: bỏ verify certificate
  espClient.setTimeout(15);
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(4096);   // đủ lớn cho chunk base64
  client.setKeepAlive(60);

  Serial.println("ESP32-CAM ready (WiFi + MQTT).");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT (CAM)...");
    if (client.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println(" CONNECTED!");
      client.subscribe(TOPIC_LISTEN); // Lắng nghe tín hiệu RFID scan
      Serial.print("Subscribed to: ");
      Serial.println(TOPIC_LISTEN);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" (Wait 5s)");
      delay(5000);
    }
  }
}

// HÀM CHỤP ẢNH VÀ GỬI
void captureAndSend() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    return;
  }

  // Encode base64
  size_t outputLength;
  mbedtls_base64_encode(NULL, 0, &outputLength, fb->buf, fb->len);
  unsigned char * encoded = new unsigned char[outputLength + 1];
  size_t olen;
  mbedtls_base64_encode(encoded, outputLength + 1, &olen, fb->buf, fb->len);
  encoded[olen] = '\0';

  String base64Str = (char*)encoded;
  int totalLen = base64Str.length();
  int chunkSize = 2048;

  // Gửi ảnh dạng chuỗi tin nhắn: IMAGE_START -> nhiều chunk -> IMAGE_END
  client.publish(TOPIC_STREAM, "IMAGE_START");
  for (int i = 0; i < totalLen; i += chunkSize) {
    int end = (i + chunkSize < totalLen) ? (i + chunkSize) : totalLen;
    String chunk = base64Str.substring(i, end);
    client.publish(TOPIC_STREAM, chunk.c_str());
    delay(5);   // tránh flood broker quá nhanh
  }
  client.publish(TOPIC_STREAM, "IMAGE_END");
  Serial.println("Image Sent!");

  delete[] encoded;
  esp_camera_fb_return(fb);
}

// KHI NHẬN TÍN HIỆU TỪ RFID -> CHỤP ẢNH
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("\n[MQTT] Tin nhan tu: ");
  Serial.println(topic);

  // Dù payload là gì (JSON UID, lệnh test...), cứ có tin ở TOPIC_LISTEN là chụp
  if (String(topic) == TOPIC_LISTEN) {
    Serial.println("-> PHAT HIEN QUET THE! DANG CHUP ANH...");
    captureAndSend();
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
}
