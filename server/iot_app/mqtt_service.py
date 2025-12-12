
import paho.mqtt.client as mqtt
import json
import threading
import time

# ===========================
# CONFIGURATION
# ===========================
MQTT_BROKER = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "pqminh"
MQTT_PASS = "pKH478Dyjpc6fW@"
USE_TLS = True

# Topics
TOPIC_DOOR_CMD = "smart_greenhouse/door/cmd"
TOPIC_DOOR_STATUS = "smart_greenhouse/door/status"
TOPIC_LCD_MSG = "greenhouse/lcd/message"
TOPIC_SENSORS = "sensors/temperature_humidity/readings"
TOPIC_RFID = "greenhouse/rfid/scan"
TOPIC_CAMERA = "greenhouse/camera/stream"

# ===========================
# IN-MEMORY STATE CACHE
# ===========================
mqtt_cache = {
    "temperature": None,
    "humidity": None,
    "last_sensor_update": None,
    "rfid_last_scan": None,
    "door_status": "UNKNOWN",
    "camera_image": None # Base64 string
}

# Image Reassembly Buffer
_image_buffer = []
_is_receiving_image = False

# ===========================
# HELPER FUNCTIONS
# ===========================

def handle_sensor_data(payload_str):
    try:
        data = json.loads(payload_str)
        mqtt_cache["temperature"] = data.get("temperature")
        mqtt_cache["humidity"] = data.get("humidity")
        mqtt_cache["last_sensor_update"] = data.get("timestamp")
        # print(f"[MQTT] Sensors updated: T={mqtt_cache['temperature']} H={mqtt_cache['humidity']}")
    except Exception as e:
        print(f"[MQTT] Sensor Parse Error: {e}")

def handle_rfid_scan(payload_str):
    try:
        data = json.loads(payload_str)
        mqtt_cache["rfid_last_scan"] = data
        print(f"[MQTT] RFID Scanned: {data.get('uid')}")
    except Exception as e:
        print(f"[MQTT] RFID Parse Error: {e}")

def handle_image_data(payload_str):
    global _image_buffer, _is_receiving_image, mqtt_cache
    
    if payload_str == "IMAGE_START":
        _image_buffer = []
        _is_receiving_image = True
        # print("[MQTT] Image reception started...")
    elif payload_str == "IMAGE_END":
        _is_receiving_image = False
        full_image = "".join(_image_buffer)
        mqtt_cache["camera_image"] = full_image
        print(f"[MQTT] Image reception complete. Size: {len(full_image)} chars")
    elif _is_receiving_image:
        _image_buffer.append(payload_str)

def handle_door_status(payload_str):
    mqtt_cache["door_status"] = payload_str

# ===========================
# MQTT CLIENT SETUP
# ===========================

client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[MQTT] Connected to Broker!")
        # Subscribe to all relevant topics
        client.subscribe(TOPIC_SENSORS)
        client.subscribe(TOPIC_RFID)
        client.subscribe(TOPIC_CAMERA)
        client.subscribe(TOPIC_DOOR_STATUS)
    else:
        print(f"[MQTT] Connection failed, rc={rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = msg.payload.decode('utf-8')
        
        if topic == TOPIC_SENSORS:
            handle_sensor_data(payload)
        elif topic == TOPIC_RFID:
            handle_rfid_scan(payload)
        elif topic == TOPIC_CAMERA:
            handle_image_data(payload)
        elif topic == TOPIC_DOOR_STATUS:
            handle_door_status(payload)
            
    except Exception as e:
        print(f"[MQTT] Message Handler Error: {e}")

client.on_connect = on_connect
client.on_message = on_message

if USE_TLS:
    client.tls_set()
    client.username_pw_set(MQTT_USER, MQTT_PASS)

# ===========================
# PUBLIC SERVICE API
# ===========================

def start_mqtt_daemon():
    """Starts the MQTT client in a background thread."""
    def run():
        print("[MQTT] Starting background loop...")
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            client.loop_forever()
        except Exception as e:
            print(f"[MQTT] Connection Error: {e}")

    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()

def publish_command(topic, payload):
    """Generic publisher."""
    if client.is_connected():
        client.publish(topic, payload)
        return True
    return False

def control_servo(state):
    """
    Control the door servo.
    State: 'open' or 'close' (case insensitive)
    """
    state_lower = state.lower()
    if state_lower not in ["open", "close"]:
        return False, "Invalid state. Use 'open' or 'close'."
    
    payload = json.dumps({"action": state_lower})
    if publish_command(TOPIC_DOOR_CMD, payload):
        return True, f"Command '{state_lower}' sent."
    return False, "MQTT not connected."

def send_lcd_message(text):
    """
    Send text to LCD.
    """
    if publish_command(TOPIC_LCD_MSG, text):
        return True, "Message sent to LCD."
    return False, "MQTT not connected."

def get_cached_data():
    return mqtt_cache
