#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "time.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "mbedtls/base64.h"

#include "wifi_setup.h"   // Giữ nguyên file này của bạn

// --- CẤU HÌNH MQTT ---
const char* MQTT_SERVER = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud";
const int   MQTT_PORT   = 8883;
const char* MQTT_USER   = "pqminh";
const char* MQTT_PASS   = "pKH478Dyjpc6fW@";
const char* MQTT_CLIENT_ID = "ESP32_CAM_NODE_FIXED";

const char* TOPIC_LISTEN = "greenhouse/rfid/scan";    
const char* TOPIC_STREAM = "greenhouse/camera/stream"; 

// --- PIN MAP ESP32-CAM ---
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

// Biến cờ (Flag) để xử lý chụp ảnh trong Loop
bool needCapture = false;

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);
  
  // 1. CAMERA INIT
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
  
  // Quan trọng: fb_count = 1 để giảm thiểu buffer cũ, nhưng vẫn cần flush
  config.frame_size   = FRAMESIZE_VGA;   
  config.jpeg_quality = 12;
  config.fb_count     = 1; 

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Loi Camera!");
    return;
  }

  // 2. WIFI
  wifiSetup();
  WiFi.setSleep(false);

  // 3. NTP
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  // 4. MQTT
  espClient.setInsecure();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  client.setBufferSize(4096); 
  client.setKeepAlive(60);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    if (client.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println(" OK!");
      client.subscribe(TOPIC_LISTEN);
    } else {
      delay(5000);
    }
  }
}

// --- HÀM CHỤP ĐÃ SỬA LỖI ẢNH CŨ ---
void captureAndSend() {
  Serial.println("-> Dang xu ly anh...");
  
  camera_fb_t * fb = NULL;

  // BƯỚC 1: XẢ ẢNH CŨ (FLUSH BUFFER)
  // Lấy ảnh đang nằm chờ trong buffer ra và vứt đi ngay lập tức
  fb = esp_camera_fb_get();
  esp_camera_fb_return(fb); 
  
  // BƯỚC 2: CHỤP ẢNH MỚI (REAL CAPTURE)
  // Lần gọi này sẽ bắt buộc Camera chụp khoảnh khắc hiện tại
  fb = esp_camera_fb_get();
  
  if (!fb) {
    Serial.println("Capture failed");
    return;
  }

  // BƯỚC 3: GỬI ẢNH
  size_t outputLength;
  mbedtls_base64_encode(NULL, 0, &outputLength, fb->buf, fb->len);
  unsigned char * encoded = new unsigned char[outputLength + 1];
  size_t olen;
  mbedtls_base64_encode(encoded, outputLength + 1, &olen, fb->buf, fb->len);
  encoded[olen] = '\0';

  String base64Str = (char*)encoded;
  int totalLen = base64Str.length();
  int chunkSize = 2048;

  client.publish(TOPIC_STREAM, "IMAGE_START");
  
  // Gửi từng phần
  for (int i = 0; i < totalLen; i += chunkSize) {
    int end = (i + chunkSize < totalLen) ? (i + chunkSize) : totalLen;
    String chunk = base64Str.substring(i, end);
    client.publish(TOPIC_STREAM, chunk.c_str());
    client.loop(); // Giữ kết nối MQTT sống khi gửi file nặng
    // delay(5); // Không cần delay nếu mạng tốt, bỏ đi cho nhanh
  }
  
  client.publish(TOPIC_STREAM, "IMAGE_END");
  Serial.println("-> Da gui xong anh MOI NHAT!");

  delete[] encoded;
  esp_camera_fb_return(fb);
}

// Callback chỉ bật cờ, KHÔNG chụp tại đây để tránh lag MQTT
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (String(topic) == TOPIC_LISTEN) {
    Serial.println("\n[MQTT] Lenh chup nhan duoc -> Set Flag");
    needCapture = true; 
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // Kiểm tra cờ trong vòng lặp chính
  if (needCapture) {
    captureAndSend(); // Chụp và gửi
    needCapture = false; // Reset cờ
  }
}
