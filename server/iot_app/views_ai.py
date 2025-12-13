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
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")  # hoặc bạn giữ hard-code key của bạn ở đây khi dev
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"


# # =========================
# # HELPERS
# # =========================
# def _extract_json_obj(text: str):
#     """
#     Gemini đôi khi trả về ```json ...``` hoặc kèm chữ.
#     Hàm này cố gắng cắt JSON object {...} và json.loads.
#     """
#     if not text:
#         return None

#     cleaned = re.sub(
#         r"^```(?:json)?\s*|```$",
#         "",
#         text.strip(),
#         flags=re.IGNORECASE | re.MULTILINE,
#     )

#     start = cleaned.find("{")
#     end = cleaned.rfind("}")
#     if start == -1 or end == -1 or end <= start:
#         return None

#     try:
#         obj = json.loads(cleaned[start : end + 1])
#         return obj if isinstance(obj, dict) else None
#     except Exception:
#         return None


# def _fallback_intent(user_text: str):
#     """
#     Fallback khi Gemini lỗi / chưa có API key.
#     Mục tiêu: hệ thống vẫn chạy được.
#     """
#     t = (user_text or "").lower()

#     # Door
#     if any(k in t for k in ["mở cửa", "mo cua", "open door", "open the door"]):
#         return {"intent": "open_door", "reply": "Được, mình mở cửa ngay.", "need_action": True, "extra": {}}

#     if any(k in t for k in ["đóng cửa", "dong cua", "close door", "close the door"]):
#         return {"intent": "close_door", "reply": "Được, mình đóng cửa ngay.", "need_action": True, "extra": {}}

#     # Sensor
#     if any(k in t for k in ["nhiệt độ", "nhiet do", "độ ẩm", "do am", "check", "kiểm tra", "kiem tra"]):
#         if any(k in t for k in ["7 ngày", "7 ngay", "1 tuần", "một tuần", "week", "7 days"]):
#             return {
#                 "intent": "get_sensor_history",
#                 "reply": "Mình sẽ kiểm tra trung bình 7 ngày gần đây.",
#                 "need_action": True,
#                 "extra": {"days": 7},
#             }
#         return {"intent": "get_sensor_now", "reply": "Mình sẽ kiểm tra nhiệt độ/độ ẩm hiện tại.", "need_action": True, "extra": {}}

#     # Unsupported (heuristic)
#     verbs = ["bật", "tắt", "turn on", "turn off"]
#     devices = ["đèn", "den", "light", "led", "quạt", "fan", "camera", "bơm", "pump"]
#     if any(v in t for v in verbs) and any(d in t for d in devices):
#         return {
#             "intent": "chitchat",
#             "reply": "hiện tại chưa tích hợp chức năng đó",
#             "need_action": False,
#             "extra": {"mode": "unsupported"},
#         }

#     # Chitchat thật (fallback)
#     return {
#         "intent": "chitchat",
#         "reply": "Mình nghe đây. Bạn muốn nói gì tiếp?",
#         "need_action": False,
#         "extra": {"mode": "chitchat"},
#     }


# def _call_gemini_structured(user_text: str):
#     """
#     Gọi Gemini để trả về JSON theo schema:
#     {
#       "intent": "open_door" | "close_door" | "get_sensor_now" | "get_sensor_history" | "chitchat",
#       "reply": "...",
#       "need_action": true/false,
#       "extra": { "days": 7, "mode": "chitchat"|"unsupported" }
#     }
#     """
#     if not GEMINI_API_KEY:
#         return None

#     schema = {
#         "type": "object",
#         "properties": {
#             "intent": {
#                 "type": "string",
#                 "enum": ["open_door", "close_door", "get_sensor_now", "get_sensor_history", "chitchat"],
#             },
#             "reply": {"type": "string"},
#             "need_action": {"type": "boolean"},
#             "extra": {
#                 "type": "object",
#                 "properties": {
#                     "days": {"type": "integer", "minimum": 1, "maximum": 30},
#                     "mode": {"type": "string", "enum": ["chitchat", "unsupported"]},
#                 },
#                 "additionalProperties": True,
#             },
#         },
#         "required": ["intent", "reply", "need_action", "extra"],
#         "additionalProperties": False,
#     }

#     prompt = (
#         "Bạn là bộ phân loại intent cho chatbot IoT. Trả về ĐÚNG 1 JSON object, KHÔNG thêm chữ nào khác.\n"
#         "Intent hợp lệ: open_door | close_door | get_sensor_now | get_sensor_history | chitchat.\n\n"
#         "Quy tắc:\n"
#         "- Mở cửa => intent=open_door, need_action=true.\n"
#         "- Đóng cửa => intent=close_door, need_action=true.\n"
#         "- Hỏi nhiệt độ/độ ẩm hiện tại hoặc nói 'Check' => intent=get_sensor_now, need_action=true.\n"
#         "- Hỏi nhiệt độ/độ ẩm 7 ngày vừa qua (1 tuần) => intent=get_sensor_history, need_action=true, extra.days=7.\n"
#         "- Yêu cầu tính năng khác (đèn/quạt/camera/...) không thuộc cửa/sensor => intent=chitchat, need_action=false, extra.mode='unsupported', reply='hiện tại chưa tích hợp chức năng đó'.\n"
#         "- Nếu chỉ nói chuyện linh tinh => intent=chitchat, need_action=false, extra.mode='chitchat', reply 1-2 câu ngắn, tự nhiên, tiếng Việt nếu user dùng tiếng Việt.\n\n"
#         f"Câu người dùng: {user_text}"
#     )

#     payload = {
#         "contents": [{"parts": [{"text": prompt}]}],
#         "generationConfig": {
#             "responseMimeType": "application/json",
#             "responseSchema": schema,
#             "temperature": 0.3,
#         },
#     }

#     headers = {"Content-Type": "application/json"}

#     try:
#         response = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=20)
#         response.raise_for_status()
#         data = response.json()

#         candidates = data.get("candidates") or []
#         if not candidates:
#             return None

#         parts = ((candidates[0].get("content") or {}).get("parts") or [])
#         if not parts:
#             return None

#         text = parts[0].get("text") if isinstance(parts[0], dict) else None
#         return _extract_json_obj(text)

#     except Exception:
#         return None

# def _call_gemini_short_chitchat_reply(user_text: str):
#     """
#     Dùng Gemini trả lời CHITCHAT 1-2 câu ngắn, liên quan trực tiếp input.
#     Chỉ dùng khi intent=chitchat và reply từ structured bị rỗng/không hợp lệ.
#     """
#     if not GEMINI_API_KEY:
#         return None

#     prompt = (
#         "Trả lời như một trợ lý thân thiện. "
#         "Chỉ trả lời 1-2 câu ngắn, liên quan trực tiếp đến câu người dùng. "
#         "Không nhắc đến hệ thống/intent/API. "
#         "Nếu người dùng dùng tiếng Việt thì trả lời tiếng Việt.\n\n"
#         f"Câu người dùng: {user_text}"
#     )

#     payload = {
#         "contents": [{"parts": [{"text": prompt}]}],
#         "generationConfig": {
#             "temperature": 0.7,
#             "maxOutputTokens": 80,
#         },
#     }

#     headers = {"Content-Type": "application/json"}

#     try:
#         r = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=20)
#         r.raise_for_status()
#         data = r.json()
#         return data["candidates"][0]["content"]["parts"][0]["text"].strip()
#     except Exception:
#         return None

# def _normalize_control_servo_result(result):
#     """
#     mqtt_service.control_servo(...) có thể trả:
#     - (ok, msg)
#     - True/False
#     - None
#     """
#     if isinstance(result, tuple) and len(result) >= 1:
#         ok = bool(result[0])
#         msg = str(result[1]) if len(result) > 1 else ""
#         return ok, msg
#     if isinstance(result, bool):
#         return result, ""
#     if result is None:
#         return False, "No response"
#     return bool(result), ""


# # =========================
# # MAIN ENDPOINT
# # =========================
# @csrf_exempt
# def chat_with_gemini(request):
#     """
#     POST /api/chat/
#     Body: { "message": "..." }

#     Client hiện tại chỉ dùng:
#     - data.reply (hiển thị tin nhắn bot)
#     """
#     if request.method != "POST":
#         return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

#     try:
#         body = json.loads(request.body or "{}")
#         user_message = str(body.get("message", "")).strip()
#     except json.JSONDecodeError:
#         return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)

#     if not user_message:
#         return JsonResponse({"status": "error", "message": "Empty message"}, status=400)

#     # 1) Gemini -> structured JSON (hoặc fallback)
#     action = _call_gemini_structured(user_message) or _fallback_intent(user_message)

#     intent = action.get("intent") or "chitchat"
#     extra = action.get("extra") if isinstance(action.get("extra"), dict) else {}
#     reply = str(action.get("reply") or "").strip()

#     # 2) Execute theo intent (CHỈ gọi mqtt_service)
#     # 2.1 Door
#     if intent in ("open_door", "close_door"):
#         desired = "open" if intent == "open_door" else "close"
#         ok, _msg = _normalize_control_servo_result(mqtt_service.control_servo(desired))

#         if ok:
#             reply = "Đã mở cửa." if desired == "open" else "Đã đóng cửa."
#         else:
#             reply = "Xin lỗi, hiện tại mình không điều khiển được cửa (MQTT chưa kết nối)."

#         return JsonResponse(
#             {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": extra},
#             status=200,
#         )

#     # 2.2 Sensor now
#     if intent == "get_sensor_now":
#         snap = mqtt_service.get_sensor_now()  # theo yêu cầu: lấy từ mqtt_cache (do mqtt_service đảm nhiệm)
#         temp = snap.get("temperature")
#         humi = snap.get("humidity")

#         if temp is None or humi is None:
#             reply = "Hiện tại chưa có dữ liệu cảm biến (chưa nhận từ MQTT)."
#         else:
#             reply = f"Nhiệt độ hiện tại là {temp}°C, độ ẩm là {humi}%."

#         return JsonResponse(
#             {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": extra},
#             status=200,
#         )

#     # 2.3 Sensor history (trung bình 7 ngày) - đã có hàm trong mqtt_service
#     if intent == "get_sensor_history":
#         days = 7  # hệ thống hiện hỗ trợ 7 ngày
#         res = mqtt_service.get_average_temperature_and_humidity_7_days()

#         if not res:
#             reply = "Hiện tại chưa lấy được dữ liệu trung bình 7 ngày (lỗi truy vấn)."
#         else:
#             avg_temp = res.get("avg_temp", 0)
#             avg_humi = res.get("avg_humi", 0)
#             count = res.get("count", 0)

#             if count == 0:
#                 reply = "Chưa có dữ liệu trong 7 ngày gần đây để tính trung bình."
#             else:
#                 reply = f"Trung bình 7 ngày gần đây: nhiệt độ ~{avg_temp}°C, độ ẩm ~{avg_humi}% (dựa trên {count} mẫu)."

#         return JsonResponse(
#             {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": {"days": days}},
#             status=200,
#         )

#     # 2.4 Chitchat vs Unsupported
#     if intent == "chitchat":
#         mode = extra.get("mode", "chitchat")

#         if mode == "unsupported":
#             reply = "hiện tại chưa tích hợp chức năng đó"
#         else:
#             # CHITCHAT thật: phải trả lời giống LLM 1-2 câu ngắn theo input
#             bad_reply = (not reply) or (reply.lower().strip() == "hiện tại chưa tích hợp chức năng đó")

#             if bad_reply:
#                 reply = _call_gemini_short_chitchat_reply(user_message)

#             # Nếu vẫn fail (mất key/mất mạng), dùng fallback có "dính" input để vẫn liên quan
#             if not reply:
#                 reply = f"Mình hiểu bạn đang nói: \"{user_message}\". Bạn muốn mình giúp gì tiếp không?"

#         return JsonResponse(
#             {"status": "success", "reply": reply, "intent": "chitchat", "need_action": False, "extra": {"mode": mode}},
#             status=200,
#         )

#     # Nếu rơi vào trường hợp ngoài dự kiến, coi như chitchat an toàn
#     return JsonResponse(
#         {"status": "success", "reply": "Mình nghe đây. Bạn muốn nói gì tiếp?", "intent": "chitchat", "need_action": False, "extra": {"mode": "chitchat"}},
#         status=200,
#     )



# =========================
# SYSTEM PROMPT (ONE PROMPT FOR ALL CASES)
# =========================
GEMINI_SYSTEM_PROMPT = """
You are the AI assistant for a Smart Greenhouse web dashboard.
Your job is to understand user requests in natural language and map them to a small set of intents.

You MUST ALWAYS respond in VALID JSON ONLY, with the following structure:

{
  "intent": "open_door" | "close_door" | "get_sensor_now" | "get_sensor_history" | "chitchat",
  "reply": "<natural language reply to show to the user (Vietnamese is preferred if user uses Vietnamese)>",
  "need_action": true | false,
  "extra": {
    "days": 7,
    "mode": "chitchat" | "unsupported"
  }
}

Intents:
- "open_door": user wants to open the greenhouse door (examples: "mở cửa đi", "open the door", "vừng ơi mở cửa ra").
- "close_door": user wants to close the greenhouse door.
- "get_sensor_now": user asks about the current temperature/humidity or says "check".
- "get_sensor_history": user asks about historical sensor data. IMPORTANT: this system only supports the last 7 days, so ALWAYS set extra.days = 7.
- "chitchat": everything else.

Rules:
1) Door control:
- If user asks to open the door => intent="open_door", need_action=true.
- If user asks to close the door => intent="close_door", need_action=true.
- For door intents, reply should be short confirmation.

2) Sensor now:
- If user asks current temperature/humidity or says "check" => intent="get_sensor_now", need_action=true.

3) Sensor history:
- If user asks temperature/humidity in the last week / 7 days / 1 tuần => intent="get_sensor_history", need_action=true, extra.days=7.

4) Unsupported commands:
- If user tries to control or change other devices/features NOT integrated (examples: fan/quạt, LCD/màn hình, light/đèn/LED, camera, pump/bơm, relay),
  set intent="chitchat", need_action=false, extra.mode="unsupported",
  and reply MUST be exactly: "hiện tại chưa tích hợp chức năng đó"

5) Real chitchat:
- If user is just talking (examples: "Tôi buồn ngủ", "Hôm nay thế nào"), set intent="chitchat", need_action=false, extra.mode="chitchat",
  and reply in 1-2 short sentences directly related to the user message.

Output constraints:
- DO NOT wrap JSON in markdown.
- DO NOT add any text before or after the JSON.
- Your entire response MUST be only one JSON object.
"""


# =========================
# JSON PARSE / VALIDATE
# =========================
ALLOWED_INTENTS = {"open_door", "close_door", "get_sensor_now", "get_sensor_history", "chitchat"}

def _extract_json_obj(text: str):
    """
    Best-effort JSON extraction in case the model returns extra text or code fences.
    """
    if not text:
        return None

    cleaned = re.sub(r"^```(?:json)?\s*|```$", "", text.strip(), flags=re.IGNORECASE | re.MULTILINE)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        obj = json.loads(cleaned[start:end + 1])
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def _validate_action(obj: dict):
    """
    Validate minimal schema to prevent random outputs breaking routing.
    """
    if not isinstance(obj, dict):
        return None

    intent = obj.get("intent")
    if intent not in ALLOWED_INTENTS:
        return None

    reply = obj.get("reply")
    need_action = obj.get("need_action")
    extra = obj.get("extra")

    if not isinstance(reply, str):
        return None
    if not isinstance(need_action, bool):
        return None
    if not isinstance(extra, dict):
        return None

    # Normalize missing optional fields
    if "mode" not in extra and intent == "chitchat":
        extra["mode"] = "chitchat"

    return {
        "intent": intent,
        "reply": reply.strip(),
        "need_action": need_action,
        "extra": extra,
    }


# =========================
# GEMINI CALL
# =========================
def _call_gemini_intent(user_text: str):
    """
    One call: Gemini returns JSON intent according to GEMINI_SYSTEM_PROMPT.
    """
    if not GEMINI_API_KEY:
        return None

    schema = {
        "type": "object",
        "properties": {
            "intent": {"type": "string", "enum": ["open_door", "close_door", "get_sensor_now", "get_sensor_history", "chitchat"]},
            "reply": {"type": "string"},
            "need_action": {"type": "boolean"},
            "extra": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer"},
                    "mode": {"type": "string", "enum": ["chitchat", "unsupported"]},
                },
                "additionalProperties": True,
            },
        },
        "required": ["intent", "reply", "need_action", "extra"],
        "additionalProperties": False,
    }

    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": GEMINI_SYSTEM_PROMPT.strip()}]},
            {"role": "user", "parts": [{"text": f"User message: {user_text}"}]},
        ],
        "generationConfig": {
            # If the API ignores these, prompt still enforces JSON;
            # If supported, these significantly increase reliability.
            "responseMimeType": "application/json",
            "responseSchema": schema,
            "temperature": 0.2,
        },
    }

    headers = {
        "Content-Type": "application/json",
        # Prefer header key (more secure than putting key in URL)
        "x-goog-api-key": GEMINI_API_KEY,
    }

    try:
        r = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=20)
        r.raise_for_status()
        data = r.json()

        candidates = data.get("candidates") or []
        if not candidates:
            return None

        parts = ((candidates[0].get("content") or {}).get("parts") or [])
        if not parts:
            return None

        text = parts[0].get("text") if isinstance(parts[0], dict) else None
        obj = _extract_json_obj(text)
        return _validate_action(obj) if obj else None
    except Exception:
        return None


# =========================
# SMALL SAFE FALLBACK (ONLY WHEN GEMINI FAILS)
# =========================
def _fallback_when_llm_fails(user_text: str):
    """
    Minimal fallback to avoid generic replies.
    - If it looks like unsupported command => fixed "chưa tích hợp"
    - Else => short reply referencing user_text (still relevant)
    """
    t = (user_text or "").lower()

    # crude unsupported detection (fan/lcd/light/camera/pump/relay)
    devices = ["quạt", "fan", "lcd", "màn hình", "man hinh", "đèn", "den", "light", "led", "camera", "cam", "bơm", "bom", "pump", "relay", "rơ le", "ro le"]
    verbs = ["bật", "tắt", "mở", "đóng", "chỉnh", "đặt", "set", "turn on", "turn off"]

    if any(d in t for d in devices) and any(v in t for v in verbs):
        return {"intent": "chitchat", "reply": "hiện tại chưa tích hợp chức năng đó", "need_action": False, "extra": {"mode": "unsupported"}}

    return {"intent": "chitchat", "reply": f"Mình hiểu bạn nói: \"{user_text}\". Bạn muốn mình giúp gì thêm không?", "need_action": False, "extra": {"mode": "chitchat"}}


def _normalize_control_servo_result(result):
    """
    mqtt_service.control_servo(...) may return:
    - (ok, msg)
    - True/False
    """
    if isinstance(result, tuple) and len(result) >= 1:
        ok = bool(result[0])
        msg = str(result[1]) if len(result) > 1 else ""
        return ok, msg
    if isinstance(result, bool):
        return result, ""
    return False, "Invalid response"


# =========================
# MAIN ENDPOINT
# =========================
@csrf_exempt
def chat_with_gemini(request):
    """
    POST /api/chat/
    Body: { "message": "..." }

    Response: must include { reply: "..." } for the current client.
    """
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body or "{}")
        user_message = str(body.get("message", "")).strip()
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)

    if not user_message:
        return JsonResponse({"status": "error", "message": "Empty message"}, status=400)

    # 1) One-shot LLM intent JSON
    action = _call_gemini_intent(user_message) or _fallback_when_llm_fails(user_message)

    intent = action["intent"]
    extra = action.get("extra", {}) if isinstance(action.get("extra"), dict) else {}
    llm_reply = action.get("reply", "")
    need_action = bool(action.get("need_action", False))

    # 2) For need_action=true intents, backend executes and overwrites reply with real results
    # 2.1 Door
    if intent in ("open_door", "close_door"):
        desired = "open" if intent == "open_door" else "close"
        ok, _msg = _normalize_control_servo_result(mqtt_service.control_servo(desired))

        if ok:
            reply = "Đã mở cửa." if desired == "open" else "Đã đóng cửa."
        else:
            reply = "Xin lỗi, hiện tại mình không điều khiển được cửa (MQTT chưa kết nối)."

        return JsonResponse(
            {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": extra},
            status=200,
        )

    # 2.2 Sensor now (from mqtt_cache via mqtt_service)
    if intent == "get_sensor_now":
        snap = mqtt_service.get_sensor_now()
        temp = snap.get("temperature")
        humi = snap.get("humidity")

        if temp is None or humi is None:
            reply = "Hiện tại chưa có dữ liệu cảm biến (chưa nhận từ MQTT)."
        else:
            reply = f"Nhiệt độ hiện tại là {temp}°C, độ ẩm là {humi}%."

        return JsonResponse(
            {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": extra},
            status=200,
        )

    # 2.3 Sensor history (fixed 7 days)
    if intent == "get_sensor_history":
        res = mqtt_service.get_average_temperature_and_humidity_7_days()
        if not res:
            reply = "Hiện tại chưa lấy được dữ liệu trung bình 7 ngày (lỗi truy vấn)."
        else:
            avg_temp = res.get("avg_temp", 0)
            avg_humi = res.get("avg_humi", 0)
            count = res.get("count", 0)

            if count == 0:
                reply = "Chưa có dữ liệu trong 7 ngày gần đây để tính trung bình."
            else:
                reply = f"Trung bình 7 ngày gần đây: nhiệt độ ~{avg_temp}°C, độ ẩm ~{avg_humi}% (dựa trên {count} mẫu)."

        return JsonResponse(
            {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": {"days": 7}},
            status=200,
        )

    # 3) need_action=false (chitchat / unsupported)
    # - For unsupported: reply must be exactly the fixed Vietnamese sentence
    if intent == "chitchat" and extra.get("mode") == "unsupported":
        reply = "hiện tại chưa tích hợp chức năng đó"
    else:
        # Real chitchat: use LLM reply (already constrained to 1–2 sentences)
        reply = llm_reply.strip() if isinstance(llm_reply, str) else ""
        if not reply:
            reply = f"Mình hiểu bạn nói: \"{user_message}\". Bạn muốn mình giúp gì thêm không?"

    return JsonResponse(
        {"status": "success", "reply": reply, "intent": intent, "need_action": False, "extra": extra},
        status=200,
    )