#pragma once
#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>

// Chân RFID giống code bạn
#define RFID_SS_PIN  5   // SDA
#define RFID_RST_PIN 27  // RST

// Các đối tượng/biến toàn cục được tạo & định nghĩa ở esp32.ino
extern MFRC522 rfid;
extern PubSubClient mqttClient;
extern const char* MQTT_TOPIC_RFID;      // "greenhouse/rfid/scan"

// Các hàm LCD được định nghĩa trong lcd_setup.h
void lcdShowScanScreen(const String &uidRaw);
void lcdShowDefaultScreen();

// Khởi tạo SPI + RC522
inline void rfidSetup() {
  SPI.begin();                 // VSPI mặc định: SCK=18, MISO=19, MOSI=23
  rfid.PCD_Init();
  rfid.PCD_SetAntennaGain(rfid.RxGain_max);

  // Có thể in version để debug nếu cần
  byte v = rfid.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("RC522 VersionReg = 0x");
  Serial.println(v, HEX);
}

// Xử lý quét RFID + publish MQTT (logic sửa lại giống hardware simulator)
// Không tự ý update LCD, không delay
inline void handleRFID() {
  // 1. Kiểm tra có thẻ mới không
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial())   return;

  // 2. Lấy UID dạng hex liền (KHÔNG có khoảng trắng, giống code bạn)
  String uidRaw = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uidRaw += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uidRaw += String(rfid.uid.uidByte[i], HEX);
  }
  uidRaw.toUpperCase();

  Serial.print("[RFID] UID = ");
  Serial.println(uidRaw);

  // 3. Gửi JSON lên MQTT topic_scan (giữ đúng payload cũ)
  String payload = "{\"uid\": \"" + uidRaw +
                   "\", \"status\": \"Scan & Capture\"}";
  mqttClient.publish(MQTT_TOPIC_RFID, payload.c_str());
  Serial.print("Publish to ");
  Serial.print(MQTT_TOPIC_RFID);
  Serial.print(": ");
  Serial.println(payload);

  // 4. Dừng giao tiếp với thẻ
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  
  // Xóa delay(3000) và lcdShowDefaultScreen để tránh chặn luồng
}