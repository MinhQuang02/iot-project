import os
import json
import re
import requests

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from . import mqtt_service


# =========================
# GEMINI CONFIGURATION
# =========================
# Khuyến nghị: dùng ENV để không lộ key khi push Git
# export GEMINI_API_KEY="..."
GEMINI_API_KEY = "AIzaSyC-schAJqZ7C9-XgVKkWSxZPktaYlo11bI"  # hoặc bạn giữ hard-code key của bạn ở đây khi dev
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"


# =========================
# HELPERS
# =========================
def _extract_json_obj(text: str):
    """
    Gemini đôi khi trả về ```json ...``` hoặc kèm chữ.
    Hàm này cố gắng cắt JSON object {...} và json.loads.
    """
    if not text:
        return None

    cleaned = re.sub(
        r"^```(?:json)?\s*|```$",
        "",
        text.strip(),
        flags=re.IGNORECASE | re.MULTILINE,
    )

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        obj = json.loads(cleaned[start : end + 1])
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def _fallback_intent(user_text: str):
    """
    Fallback khi Gemini lỗi / chưa có API key.
    Mục tiêu: hệ thống vẫn chạy được.
    """
    t = (user_text or "").lower()

    # Door
    if any(k in t for k in ["mở cửa", "mo cua", "open door", "open the door"]):
        return {"intent": "open_door", "reply": "Được, mình mở cửa ngay.", "need_action": True, "extra": {}}

    if any(k in t for k in ["đóng cửa", "dong cua", "close door", "close the door"]):
        return {"intent": "close_door", "reply": "Được, mình đóng cửa ngay.", "need_action": True, "extra": {}}

    # Sensor
    if any(k in t for k in ["nhiệt độ", "nhiet do", "độ ẩm", "do am", "check", "kiểm tra", "kiem tra"]):
        if any(k in t for k in ["7 ngày", "7 ngay", "1 tuần", "một tuần", "week", "7 days"]):
            return {
                "intent": "get_sensor_history",
                "reply": "Mình sẽ kiểm tra trung bình 7 ngày gần đây.",
                "need_action": True,
                "extra": {"days": 7},
            }
        return {"intent": "get_sensor_now", "reply": "Mình sẽ kiểm tra nhiệt độ/độ ẩm hiện tại.", "need_action": True, "extra": {}}

    # Unsupported (heuristic)
    verbs = ["bật", "tắt", "turn on", "turn off", "mở", "đóng"]
    devices = ["đèn", "den", "light", "led", "quạt", "fan", "camera", "bơm", "pump", "tivi"]
    if any(d in t for d in devices) and any(v in t for v in verbs): # Check thiết bị trước cho chắc
        return {
            "intent": "unsupported", # Intent mới
            "reply": "hiện tại chưa tích hợp chức năng đó",
            "need_action": False,
        }

    # Chitchat thật (fallback)
    return {
        "intent": "chitchat",
        "reply": "Mình nghe đây. Bạn muốn nói gì tiếp?",
        "need_action": False,
        "extra": {"mode": "chitchat"},
    }


def _call_gemini_structured(user_text: str):
    if not GEMINI_API_KEY:
        return None

    schema = {
        "type": "object",
        "properties": {
            "intent": {
                "type": "string",
                "enum": ["open_door", "close_door", "get_sensor_now", "get_sensor_history", "chitchat", "unsupported"],
            },
            "reply": {"type": "string"},
            "need_action": {"type": "boolean"},
            "extra_days": {"type": "integer"}, # Làm phẳng structure cho model dễ điền
        },
        "required": ["intent", "reply", "need_action"],
    }

    prompt = f"""
    Bạn là trợ lý nhà thông minh (Smart Home). Nhiệm vụ: Phân loại ý định (intent) và tạo câu trả lời JSON.
    
    DANH SÁCH INTENT & QUY TẮC:
    1. open_door: Mở cửa (Gồm cả các câu ẩn dụ như "vừng ơi mở ra", "mở cổng"). Action: true.
    2. close_door: Đóng cửa (Gồm cả các câu ẩn dụ như "đóng lại", "vừng ơi đóng lại"). Action: true.
    3. get_sensor_now: Hỏi nhiệt độ/độ ẩm hiện tại hoặc "check". Action: true.
    4. get_sensor_history: Hỏi nhiệt độ/độ ẩm quá khứ (hôm qua, tuần trước, 7 ngày). Action: true. Luôn set extra_days=7.
    5. unsupported: Người dùng sai lệnh điều khiển thiết bị KHÔNG CÓ trong hệ thống (Quạt, Đèn, Tivi, Bơm, Camera...). Action: false. Reply bắt buộc: "hiện tại chưa tích hợp chức năng đó".
    6. chitchat: Các câu chào hỏi, cảm xúc, không liên quan thiết bị. Action: false. Reply: Trả lời tự nhiên, ngắn gọn (1-2 câu), thân thiện.

    VÍ DỤ MẪU (BẮT BUỘC HỌC THEO):
    - User: "Mở cửa ra đi" -> {{"intent": "open_door", "need_action": true, "reply": "Được, mình mở cửa ngay"}}
    - User: "Vừng ơi mở ra" -> {{"intent": "open_door", "need_action": true, "reply": "Cửa đang mở đây"}}
    - User: "Nhiệt độ phòng sao rồi" -> {{"intent": "get_sensor_now", "need_action": true, "reply": "Đang kiểm tra sensor..."}}
    - User: "Mở quạt lên" -> {{"intent": "unsupported", "need_action": false, "reply": "hiện tại chưa tích hợp chức năng đó"}}
    - User: "Bật đèn giùm" -> {{"intent": "unsupported", "need_action": false, "reply": "hiện tại chưa tích hợp chức năng đó"}}
    - User: "Buồn ngủ quá" -> {{"intent": "chitchat", "need_action": false, "reply": "Nếu mệt thì bạn nghỉ ngơi chút đi nhé."}}
    - User: "Chào em" -> {{"intent": "chitchat", "need_action": false, "reply": "Chào bạn, mình có thể giúp gì cho nhà kính không?"}}

    INPUT NGƯỜI DÙNG: "{user_text}"
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema,
            "temperature": 0.5,
        },
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        
        candidates = data.get("candidates") or []
        if not candidates: return None
        parts = ((candidates[0].get("content") or {}).get("parts") or [])
        text = parts[0].get("text") if parts else None
        
        return _extract_json_obj(text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        return None

def _call_gemini_short_chitchat_reply(user_text: str):
    """
    Dùng Gemini trả lời CHITCHAT 1-2 câu ngắn, liên quan trực tiếp input.
    Chỉ dùng khi intent=chitchat và reply từ structured bị rỗng/không hợp lệ.
    """
    if not GEMINI_API_KEY:
        return None

    prompt = (
        "Trả lời như một trợ lý thân thiện. "
        "Chỉ trả lời 1-2 câu ngắn, liên quan trực tiếp đến câu người dùng. "
        "Không nhắc đến hệ thống/intent/API. "
        "Nếu người dùng dùng tiếng Việt thì trả lời tiếng Việt.\n\n"
        f"Câu người dùng: {user_text}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 80,
        },
    }

    headers = {"Content-Type": "application/json"}

    try:
        r = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=20)
        r.raise_for_status()
        data = r.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return None

def _normalize_control_servo_result(result):
    """
    mqtt_service.control_servo(...) có thể trả:
    - (ok, msg)
    - True/False
    - None
    """
    if isinstance(result, tuple) and len(result) >= 1:
        ok = bool(result[0])
        msg = str(result[1]) if len(result) > 1 else ""
        return ok, msg
    if isinstance(result, bool):
        return result, ""
    if result is None:
        return False, "No response"
    return bool(result), ""


# =========================
# MAIN ENDPOINT
# =========================
@csrf_exempt
def chat_with_gemini(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body or "{}")
        user_message = str(body.get("message", "")).strip()
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)

    if not user_message:
        return JsonResponse({"status": "error", "message": "Empty message"}, status=400)

    action = _call_gemini_structured(user_message)
    
    if not action:
        action = _fallback_intent(user_message)

    intent = action.get("intent", "chitchat")
    reply = action.get("reply", "")
    need_action = action.get("need_action", False)

    extra_days = action.get("extra_days") or action.get("extra", {}).get("days", 0)

    # 2) Execute theo intent (CHỈ gọi mqtt_service)
    # 2.1 Door
    if intent in ["open_door", "close_door"]:
        desired = "open" if intent == "open_door" else "close"
        ok, msg = _normalize_control_servo_result(mqtt_service.control_servo(desired))
        
        # Override câu reply của AI để đảm bảo tính xác thực của hành động
        final_reply = "Đã thực hiện lệnh mở cửa." if desired == "open" else "Đã thực hiện lệnh đóng cửa."
        if not ok:
            final_reply = "Lỗi kết nối MQTT, không thể điều khiển cửa."

        return JsonResponse({
            "status": "success", 
            "reply": final_reply, 
            "intent": intent
        })

    # 2.2 Sensor now
    if intent == "get_sensor_now":
        snap = mqtt_service.get_sensor_now()
        temp = snap.get("temperature")
        humi = snap.get("humidity")
        
        if temp is None:
            final_reply = "Hiện tại chưa nhận được dữ liệu từ cảm biến."
        else:
            final_reply = f"Nhiệt độ hiện tại: {temp}°C, Độ ẩm: {humi}%."
            
        return JsonResponse({
            "status": "success", 
            "reply": final_reply, 
            "intent": intent
        })

    # 2.3 Sensor history (trung bình 7 ngày) - đã có hàm trong mqtt_service
    if intent == "get_sensor_history":
        res = mqtt_service.get_average_temperature_and_humidity_7_days()
        if not res or res.get("count", 0) == 0:
            final_reply = "Chưa có đủ dữ liệu lịch sử 7 ngày qua."
        else:
            avg_t = res.get("avg_temp")
            avg_h = res.get("avg_humi")
            final_reply = f"Trung bình 7 ngày qua: Nhiệt độ {avg_t}°C, Độ ẩm {avg_h}%."
            
        return JsonResponse({
            "status": "success", 
            "reply": final_reply, 
            "intent": intent
        })

    # 2.4 Unsupported Devices (Đèn, Quạt...)
    if intent == "unsupported":
        # Gemini đã được dạy trả lời câu chuẩn trong prompt, ta dùng luôn
        # Hoặc hardcode lại cho chắc chắn
        return JsonResponse({
            "status": "success", 
            "reply": "Hiện tại chưa tích hợp chức năng đó.", 
            "intent": intent
        })
    
    # 2.4 Chitchat
    if intent == "chitchat":
        # Fallback nếu reply rỗng
        if not reply or len(reply) < 2:
             # Gọi hàm chat ngắn bổ sung nếu cần (optional), hoặc trả lời mặc định
             reply = _call_gemini_short_chitchat_reply(user_message) or "Mình đang lắng nghe đây."
             
        return JsonResponse({
            "status": "success", 
            "reply": reply, 
            "intent": intent
        })

    # Nếu rơi vào trường hợp ngoài dự kiến, coi như chitchat an toàn
    return JsonResponse({"status": "success", "reply": "Mình chưa hiểu ý bạn lắm.", "intent": "unknown"})
