import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# GEMINI CONFIGURATION
# In a production environment, this should be in os.environ or settings.py
GEMINI_API_KEY = "AIzaSyBMLDgixmFYgOQLZa0m7ka1xVebtWbyYlI"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

@csrf_exempt
def chat_with_gemini(request):
    """
    Handle Chatbot requests using Google Gemini API.
    POST /api/chat/
    Body: { "message": "Hello" }
    """
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            user_message = body.get('message', '')

            if not user_message:
                return JsonResponse({'status': 'error', 'message': 'Empty message'}, status=400)

            # --- CALL GEMINI API ---
            payload = {
                "contents": [{
                    "parts": [{"text": user_message}]
                }]
            }
            
            headers = {'Content-Type': 'application/json'}
            
            # Call Google API
            response = requests.post(GEMINI_URL, headers=headers, json=payload)
            response.raise_for_status() # Raise error for bad status codes
            
            data = response.json()
            
            # Parse Response
            # Structure: data['candidates'][0]['content']['parts'][0]['text']
            try:
                ai_reply = data['candidates'][0]['content']['parts'][0]['text']
            except (KeyError, IndexError):
                ai_reply = "I'm sorry, I couldn't process that response."

            return JsonResponse({'status': 'success', 'reply': ai_reply})

        except requests.exceptions.RequestException as e:
            print(f"[AI Error] Google API Error: {e}")
            return JsonResponse({'status': 'error', 'message': 'AI Service Unavailable'}, status=503)
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            print(f"[AI Error] Server Error: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
