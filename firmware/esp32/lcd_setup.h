#pragma once
#include <Arduino.h>
#include <LiquidCrystal_I2C.h>

// Địa chỉ & kích thước LCD giống code bạn: 0x27, 16x2
#define LCD_ADDR 0x27
#define LCD_COLS 16
#define LCD_ROWS 2

// Đối tượng LCD sẽ được tạo thật trong esp32.ino
extern LiquidCrystal_I2C lcd;

// Khởi động LCD + màn hình chào (giữ đúng text + delay như code bạn)
inline void lcdSetup() {
  lcd.init();
  lcd.backlight();

  // Màn hình chào khi khởi động
  lcd.setCursor(0, 0); lcd.print("   XIN CHAO!   ");
  lcd.setCursor(0, 1); lcd.print("Smart GreenHouse");
  delay(2000); // Giữ màn hình chào 2 giây
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Ket noi Wifi...");
}

// Màn hình chờ mặc định: "Ready to Scan..."
inline void lcdShowDefaultScreen() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Ready to Scan...");
  lcd.setCursor(0, 1); lcd.print("Moi quet the >>");
}

// Khi vừa quét thẻ: hiện UID + "Dang chup anh..."
inline void lcdShowScanScreen(const String &uidRaw) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ID: " + uidRaw);
  lcd.setCursor(0, 1);
  lcd.print("Dang chup anh...");
}

// Xử lý hiển thị message từ Web (MQTT) – giữ đúng logic cũ
inline void lcdShowMessageFromWeb(const String &message) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("New Message:");

  lcd.setCursor(0, 1);
  if (message.length() > 16) {
    lcd.print(message.substring(0, 16)); // cắt 16 ký tự đầu như code bạn
  } else {
    lcd.print(message);
  }

  // Giữ tin nhắn 5s rồi quay lại màn hình chờ
  delay(5000);
  lcdShowDefaultScreen();
}
