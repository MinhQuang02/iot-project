import customtkinter as ctk
import paho.mqtt.client as mqtt
import threading
import time
import json
import random
import ssl
from datetime import datetime, timezone
import base64

# ==========================================
# CONFIGURATION
# ==========================================
MQTT_SERVER = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "pqminh"
MQTT_PASS = "pKH478Dyjpc6fW@"

# Topics
TOPIC_DHT = "sensors/temperature_humidity/readings"
TOPIC_SERVO_CMD = "smart_greenhouse/door/cmd"
TOPIC_SERVO_STATUS = "smart_greenhouse/door/status"
TOPIC_RFID = "greenhouse/rfid/scan"
TOPIC_LCD = "greenhouse/lcd/message"
TOPIC_CAM_STREAM = "greenhouse/camera/stream"

# Simulation Settings
DHT_INTERVAL = 10  # Seconds

# ==========================================
# SIMULATOR CLASS
# ==========================================
class HardwareSimulator(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Setup
        self.title("IoT Hardware Simulator (ESP32 + ESP32-CAM)")
        self.geometry("900x600")
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        # UI Layout
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # --- SECTION 1: ESP32 MAIN CONTROLLER ---
        self.frame_main = ctk.CTkFrame(self, corner_radius=10)
        self.frame_main.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.setup_main_ui()

        # --- SECTION 2: ESP32 CAM ---
        self.frame_cam = ctk.CTkFrame(self, corner_radius=10)
        self.frame_cam.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        self.setup_cam_ui()

        # State Variables
        self.door_status = "CLOSED"
        self.dht_running = True
        
        # Initialize MQTT Clients
        self.main_client = self.create_mqtt_client(f"ESP-MAIN-{random.randint(0, 0xffff):04X}")
        self.cam_client = self.create_mqtt_client("ESP32_CAM_NODE")

        # Start Connections
        threading.Thread(target=self.connect_main_client, daemon=True).start()
        threading.Thread(target=self.connect_cam_client, daemon=True).start()

        # Start Background Jobs
        threading.Thread(target=self.dht_loop, daemon=True).start()

    def setup_main_ui(self):
        """Build UI for ESP32 Main Controller"""
        ctk.CTkLabel(self.frame_main, text="ESP32 MAIN CONTROLLER", font=("Arial", 20, "bold")).pack(pady=10)

        # 1. DHT Sensor
        self.frame_dht = ctk.CTkFrame(self.frame_main)
        self.frame_dht.pack(pady=10, padx=10, fill="x")
        ctk.CTkLabel(self.frame_dht, text="DHT11 Sensor Simulation", font=("Arial", 14, "bold")).pack(pady=5)
        self.lbl_temp = ctk.CTkLabel(self.frame_dht, text="Temperature: -- °C", font=("Arial", 16))
        self.lbl_temp.pack()
        self.lbl_humi = ctk.CTkLabel(self.frame_dht, text="Humidity: -- %", font=("Arial", 16))
        self.lbl_humi.pack(pady=5)

        # 2. LCD Display
        self.frame_lcd = ctk.CTkFrame(self.frame_main)
        self.frame_lcd.pack(pady=10, padx=10, fill="x")
        ctk.CTkLabel(self.frame_lcd, text="LCD Display 20x4", font=("Arial", 14, "bold")).pack(pady=5)
        self.lcd_screen = ctk.CTkLabel(self.frame_lcd, text="Waiting...", width=300, height=60, 
                                     fg_color="gray20", corner_radius=5, font=("Courier New", 18))
        self.lcd_screen.pack(pady=10)

        # 3. Servo / Door
        self.frame_servo = ctk.CTkFrame(self.frame_main)
        self.frame_servo.pack(pady=10, padx=10, fill="x")
        ctk.CTkLabel(self.frame_servo, text="Servo / Door Control", font=("Arial", 14, "bold")).pack(pady=5)
        self.lbl_door = ctk.CTkLabel(self.frame_servo, text="DOOR STATUS: CLOSED", 
                                     fg_color="red", corner_radius=8, width=200, height=40, font=("Arial", 16, "bold"))
        self.lbl_door.pack(pady=10)

        # 4. RFID
        self.frame_rfid = ctk.CTkFrame(self.frame_main)
        self.frame_rfid.pack(pady=10, padx=10, fill="x")
        ctk.CTkLabel(self.frame_rfid, text="RFID Simulation", font=("Arial", 14, "bold")).pack(pady=5)
        self.entry_rfid = ctk.CTkEntry(self.frame_rfid, placeholder_text="Enter Card Hex ID (e.g. A1B2C3D4)")
        self.entry_rfid.pack(pady=5)
        ctk.CTkButton(self.frame_rfid, text="Scan Card", command=self.sim_rfid_scan).pack(pady=10)

    def setup_cam_ui(self):
        """Build UI for ESP32 Camera"""
        ctk.CTkLabel(self.frame_cam, text="ESP32 CAMERA", font=("Arial", 20, "bold")).pack(pady=10)
        
        # Log Area
        self.cam_log = ctk.CTkTextbox(self.frame_cam, width=350, height=400)
        self.cam_log.pack(pady=10, padx=10)
        self.log_cam("Camera initialized.")
        self.log_cam("Waiting for trigger (RFID Scan)...")

    # ==========================================
    # MQTT LOGIC
    # ==========================================
    def create_mqtt_client(self, client_id):
        client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
        client.username_pw_set(MQTT_USER, MQTT_PASS)
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)
        return client

    def connect_main_client(self):
        self.main_client.on_connect = self.on_main_connect
        self.main_client.on_message = self.on_main_message
        try:
            self.main_client.connect(MQTT_SERVER, MQTT_PORT, 60)
            self.main_client.loop_forever()
        except Exception as e:
            print(f"Main Client Connect Error: {e}")

    def connect_cam_client(self):
        self.cam_client.on_connect = self.on_cam_connect
        self.cam_client.on_message = self.on_cam_message
        try:
            self.cam_client.connect(MQTT_SERVER, MQTT_PORT, 60)
            self.cam_client.loop_forever()
        except Exception as e:
            print(f"Cam Client Connect Error: {e}")

    def on_main_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("ESP32 Main Connected!")
            client.subscribe(TOPIC_SERVO_CMD)
            client.subscribe(TOPIC_LCD)
        else:
            print(f"ESP32 Main Connection Failed rc={rc}")

    def on_cam_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("ESP32 Cam Connected!")
            client.subscribe(TOPIC_RFID) # Camera listens to RFID scan to trigger
        else:
            print(f"ESP32 Cam Connection Failed rc={rc}")

    def on_main_message(self, client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode("utf-8")
        print(f"[MAIN] Msg: {topic} -> {payload}")

        if topic == TOPIC_LCD:
            self.update_lcd(payload)
        elif topic == TOPIC_SERVO_CMD:
            self.handle_servo_cmd(payload)

    def on_cam_message(self, client, userdata, msg):
        topic = msg.topic
        print(f"[CAM] Msg: {topic}")
        if topic == TOPIC_RFID:
            # Trigger camera logic
            self.trigger_camera()

    # ==========================================
    # SIMULATION LOGIC
    # ==========================================

    # --- DHT ---
    def dht_loop(self):
        while self.dht_running:
            temp = round(random.uniform(20.0, 35.0), 2)
            humi = round(random.uniform(40.0, 90.0), 2)
            timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")

            data = {
                "temperature": temp,
                "humidity": humi,
                "timestamp": timestamp
            }
            json_payload = json.dumps(data)

            # Update UI
            self.lbl_temp.configure(text=f"Temperature: {temp} °C")
            self.lbl_humi.configure(text=f"Humidity: {humi} %")

            # Publish
            if self.main_client.is_connected():
                self.main_client.publish(TOPIC_DHT, json_payload)
                print(f"[DHT] Published: {json_payload}")
            
            time.sleep(DHT_INTERVAL)

    # --- SERVO ---
    def handle_servo_cmd(self, payload):
        try:
            data = json.loads(payload)
            action = data.get("action", "").lower()
            
            if action == "open":
                self.door_status = "OPENED"
                self.update_door_ui("OPENED")
                self.main_client.publish(TOPIC_SERVO_STATUS, "OPENED")
                print("Door OPENED")
            elif action == "close":
                self.door_status = "CLOSED"
                self.update_door_ui("CLOSED")
                self.main_client.publish(TOPIC_SERVO_STATUS, "CLOSED")
                print("Door CLOSED")
        except Exception as e:
            print(f"Servo JSON Error: {e}")

    def update_door_ui(self, status):
        color = "green" if status == "OPENED" else "red"
        self.lbl_door.configure(text=f"DOOR STATUS: {status}", fg_color=color)

    # --- LCD ---
    def update_lcd(self, text):
        self.lcd_screen.configure(text=text)

    # --- RFID ---
    def sim_rfid_scan(self):
        uid = self.entry_rfid.get().strip().upper()
        if not uid:
            uid = f"{random.randint(0, 255):02X}{random.randint(0, 255):02X}{random.randint(0, 255):02X}{random.randint(0, 255):02X}"
            self.entry_rfid.delete(0, 'end')
            self.entry_rfid.insert(0, uid)
        
        payload = {
            "uid": uid,
            "status": "Scan & Capture"
        }
        json_str = json.dumps(payload)
        
        if self.main_client.is_connected():
            self.main_client.publish(TOPIC_RFID, json_str)
            print(f"[RFID] Scanned: {json_str}")
        
    # --- CAMERA ---
    def trigger_camera(self):
        self.log_cam("Camera Triggered!")
        threading.Thread(target=self._send_image_stream, daemon=True).start()

    def _send_image_stream(self):
        if not self.cam_client.is_connected():
            self.log_cam("Error: MQTT not connected")
            return
            
        dummy_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" * 50 # Longer string
        
        self.log_cam("Sending IMAGE_START...")
        self.cam_client.publish(TOPIC_CAM_STREAM, "IMAGE_START")
        
        chunk_size = 2048
        total_len = len(dummy_base64)
        
        for i in range(0, total_len, chunk_size):
            chunk = dummy_base64[i:i+chunk_size]
            self.cam_client.publish(TOPIC_CAM_STREAM, chunk)
            time.sleep(0.05) # Simulate network delay
            self.log_cam(f"Sent chunk {i//chunk_size + 1}...")
            
        self.cam_client.publish(TOPIC_CAM_STREAM, "IMAGE_END")
        self.log_cam("Sending IMAGE_END... Done!")

    def log_cam(self, msg):
        def _log():
            self.cam_log.insert("end", f"{msg}\n")
            self.cam_log.see("end")
        self.after(0, _log)

if __name__ == "__main__":
    app = HardwareSimulator()
    app.mainloop()
