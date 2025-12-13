
import paho.mqtt.client as mqtt
import json
import threading
import time
import ssl
import base64
from datetime import datetime
from .supabase_client import get_supabase_client

# ===========================
# CONFIGURATION
# ===========================
MQTT_BROKER = "0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "pqminh"
MQTT_PASS = "pKH478Dyjpc6fW@"
USE_TLS = True

# Topics (Matched with Firmware)
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
_image_lock = threading.Lock()
_pending_rfid_session = None  # To track the current RFID session waiting for an image

# ===========================
# HELPER FUNCTIONS
# ===========================

def handle_sensor_data(payload_str):
    try:
        data = json.loads(payload_str)
        temp = data.get("temperature")
        humi = data.get("humidity")
        timestamp = data.get("timestamp") or datetime.now().isoformat()

        mqtt_cache["temperature"] = temp
        mqtt_cache["humidity"] = humi
        mqtt_cache["last_sensor_update"] = timestamp
        
        # Save to DB - Round to int to match Supabase integer column types
        temp_val = int(round(float(temp))) if temp is not None else None
        humi_val = int(round(float(humi))) if humi is not None else None

        supabase = get_supabase_client()
        supabase.table('TRANG_THAI_NHA_KINH').insert({
            "NhietDo": temp_val,
            "DoAm": humi_val,
            "ThoiGian": timestamp
        }).execute()
        
        # print(f"[SERVER] >> Received Temp: {temp}°C, Humi: {humi}%")
    except Exception as e:
        print(f"[SERVER] Sensor Parse Error: {e}")

def handle_rfid_scan(payload_str):
    global _pending_rfid_session
    try:
        data = json.loads(payload_str)
        uid = data.get("uid")
        mqtt_cache["rfid_last_scan"] = data
        
        print(f"[DEBUG] 1. MQTT Received RFID: {uid}")
        
        # 1. Check if we are already processing a capture 
        if _pending_rfid_session is not None:
             print(f"[SERVER] Ignored Scan {uid} - Camera Busy with {_pending_rfid_session['uid']}")
             return

        # 2. TRIGGER CAMERA ONCE
        if request_camera_capture():
            _pending_rfid_session = {
                "uid": uid,
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        print(f"[ERROR] RFID Parse Error: {e}")

def process_rfid_validation(uid, image_url=None):
    """
    Validate ID against DB, Control Door/LCD, and Save History
    Refined with strict debugging and specific field mapping.
    """
    supabase = get_supabase_client()
    try:
        # 2. Validation
        res = supabase.table('NGUOI_DUNG').select('HoND, TenND, MaID').eq('MaID', uid).execute()
        user = res.data[0] if res.data else None
        
        is_authorized = False
        full_name = "Unknown"
        
        if user:
            is_authorized = True
            full_name = f"{user['HoND']} {user['TenND']}"
            print(f"[DEBUG] 2. User Validated: {full_name}")
            
            # Open Door & LCD
            control_servo("open")
            send_lcd_message(f"Welcome {user['TenND']}!")
            
            # Close door after 5s
            threading.Timer(5.0, lambda: control_servo("close")).start()
            threading.Timer(5.0, lambda: send_lcd_message("Ready to Scan...")).start()

        else:
            print(f"[DEBUG] 2. User Validated: Not Found ({uid})")
            send_lcd_message("Cards do not match")
            threading.Timer(3.0, lambda: send_lcd_message("Ready to Scan...")).start()

        # 5. Inserting into DB LICH_SU_NHA_KINH
        print("[DEBUG] 5. Inserting into DB LICH_SU_NHA_KINH...")
        
        # Map fields per instructions
        # MaID: The ID received. If user doesn't exist, we try to insert the ID anyway if the DB allows foreign key issues,
        # OR we insert NULL. The user prompt says "MaID: The RFID Card ID received".
        # If the DB enforces FK, this might fail for unknown users. We try 'uid' first.
        
        history_entry = {
            "MaID": uid if user else None, # Use None to avoid FK error if user unknown
            "ThoiDiemVao": datetime.now().isoformat(),
            "AnhXacMinh": image_url,   # Mapped from 'HinhAnh' to 'AnhXacMinh' per request
            "TrangThai": is_authorized, # TRUE/FALSE
            "TrangThaiAnh": True        # TRUE
        }
        
        # Fallback logging if schema differs (e.g. HinhAnh vs AnhXacMinh)
        # We try strict naming first.
        try:
            insert_res = supabase.table('LICH_SU_NHA_KINH').insert(history_entry).execute()
            print("[DEBUG] 6. SUCCESS: History Recorded.")
        except Exception as db_err:
             print(f"[ERROR] History Insert Failed: {db_err}")
             print(f"[ERROR] payload was: {history_entry}")

    except Exception as e:
        print(f"[ERROR] Validation/DB Error: {e}")


def handle_image_data(payload_str):
    global _image_buffer, _is_receiving_image, mqtt_cache, _pending_rfid_session
    
    if payload_str == "IMAGE_START":
        with _image_lock:
            _image_buffer = []
        _is_receiving_image = True
    elif payload_str == "IMAGE_END":
        _is_receiving_image = False
        with _image_lock:
            full_image = "".join(_image_buffer)
        mqtt_cache["camera_image"] = full_image
        # print(f" DONE. (Size: {len(full_image)} chars)")
        
        # --- PROCESS PENDING RFID SESSION ---
        if _pending_rfid_session:
            uid = _pending_rfid_session["uid"]
            
            print("[DEBUG] 3. Uploading Image to Storage...")
            # 1. Upload Image to Supabase Storage
            image_url = upload_image_to_supabase(full_image, uid)
            print(f"[DEBUG] 4. Image URL Generated: {image_url}")
            
            # 2. Proceed with Validation
            process_rfid_validation(uid, image_url)
            
            _pending_rfid_session = None # Clear session

    elif _is_receiving_image:
        with _image_lock:
            _image_buffer.append(payload_str)


def upload_image_to_supabase(base64_str, uid):
    """
    Decodes base64 and uploads to 'image' bucket. Returns public URL.
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Sanitize Base64 string
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
            
        # Decode Base64 to Bytes
        try:
            img_bytes = base64.b64decode(base64_str)
        except Exception as e:
            print(f"[ERROR] Base64 Decode Error: {e}")
            return None
        
        # 2. Unique Filename
        timestamp = int(time.time())
        filename = f"{uid}_{timestamp}.jpg"
        bucket_name = "image"
        
        # 3. Upload
        res = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=img_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        
        # 4. Get Public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        
        return public_url
        
    except Exception as e:
        print(f"[ERROR] Supabase Storage Error: {e}")
        return None


def handle_door_status(payload_str):
    mqtt_cache["door_status"] = payload_str
    print(f"[SERVER] >> Door Status: {payload_str}")

# ===========================
# MQTT CLIENT SETUP
# ===========================

client = mqtt.Client(client_id="DJANGO_SERVER_BRIDGE", protocol=mqtt.MQTTv311)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("\n[SERVER] Connected to MQTT Broker Successfully!")
        client.subscribe(TOPIC_SENSORS)
        client.subscribe(TOPIC_RFID)
        client.subscribe(TOPIC_CAMERA)
        client.subscribe(TOPIC_DOOR_STATUS)
        print("[SERVER] Subscribed to [Sensors, RFID, Camera, DoorStatus]")
    else:
        print(f"[SERVER] MQTT Connection failed, rc={rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = msg.payload.decode('utf-8', errors='ignore')
        
        if topic == TOPIC_SENSORS:
            handle_sensor_data(payload)
        elif topic == TOPIC_RFID:
            # Note: Firmware might send non-JSON messages? 
            # Our Simulator sends JSON. Real firmware might send raw string.
            # Let's support both if needed, but for now simulator sends JSON.
            handle_rfid_scan(payload) 
        elif topic == TOPIC_CAMERA:
            handle_image_data(payload)
        elif topic == TOPIC_DOOR_STATUS:
            handle_door_status(payload)
            
    except Exception as e:
        print(f"[SERVER] Message Handler Error: {e}")

client.on_connect = on_connect
client.on_message = on_message

if USE_TLS:
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)
    client.username_pw_set(MQTT_USER, MQTT_PASS)

# ===========================
# PUBLIC SERVICE API
# ===========================

_daemon_started = False

def start_mqtt_daemon():
    global _daemon_started
    if _daemon_started:
        return

    def run():
        print("[SERVER] Starting MQTT Loop in background...")
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            client.loop_forever()
        except Exception as e:
            print(f"[SERVER] MQTT Connection Error: {e}")

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    _daemon_started = True

def publish_command(topic, payload):
    if client.is_connected():
        client.publish(topic, payload)
        return True
    print("[SERVER] Error: MQTT Not Connected")
    return False

def control_servo(state):
    state_lower = state.lower()
    payload = json.dumps({"action": state_lower})
    if publish_command(TOPIC_DOOR_CMD, payload):
        print(f"[SERVER] << Sent DOOR Command: {state_lower}")
        return True, f"Command '{state_lower}' sent."
    return False, "MQTT not connected."

def send_lcd_message(text):
    if publish_command(TOPIC_LCD_MSG, text):
        print(f"[SERVER] << Sent LCD Message: {text}")
        return True, "Message sent to LCD."
    return False, "MQTT not connected."

def request_camera_capture():
    payload = json.dumps({"status": "SERVER_REQUEST_CAPTURE", "uid": "SERVER"})
    if publish_command(TOPIC_RFID, payload):
        print("[SERVER] << Sent Camera Trigger Request")
        return True, "Camera trigger sent."
    return False, "MQTT not connected."

def get_cached_data():
    return mqtt_cache
