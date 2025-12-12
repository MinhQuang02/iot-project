#pragma once
#include <ESP32Servo.h>

// CHÂN SERVO: bạn đấu dây tín hiệu servo vào GPIO25 của NodeMCU
#define SERVO_PIN         25
#define SERVO_OPEN_ANGLE  90
#define SERVO_CLOSE_ANGLE 0

class DoorServo {
public:
  void begin() {
    servo.attach(SERVO_PIN);
    closeDoor();   // mặc định đóng cửa
  }

  void openDoor() {
    servo.write(SERVO_OPEN_ANGLE);
    is_open = true;
  }

  void closeDoor() {
    servo.write(SERVO_CLOSE_ANGLE);
    is_open = false;
  }

  void toggleDoor() {
    if (is_open) closeDoor();
    else openDoor();
  }

  bool isOpen() const { return is_open; }

private:
  Servo servo;
  bool  is_open = false;
};

// Khai báo extern – định nghĩa thật nằm trong .ino
extern DoorServo doorServo;
