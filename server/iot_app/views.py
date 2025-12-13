import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .supabase_client import get_supabase_client

def test_health(request):
    try:
        client = get_supabase_client()
        # Simple query to check connection, e.g., count users or just check if client exists
        # We'll try to select 1 record from NGUOI_DUNG to verify DB access
        response = client.table('NGUOI_DUNG').select("count", count='exact').limit(1).execute()
        return JsonResponse({'status': 'ok', 'message': 'Supabase connection successful', 'data': response.data})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def test_data(request):
    client = get_supabase_client()
    
    if request.method == 'GET':
        try:
            response = client.table('NGUOI_DUNG').select("*").execute()
            return JsonResponse({'status': 'success', 'data': response.data}, safe=False)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
            
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Basic validation could go here
            response = client.table('NGUOI_DUNG').insert(data).execute()
            return JsonResponse({'status': 'success', 'data': response.data}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

def test_create(request):
    client = get_supabase_client()
    
    try:
        data = json.loads(request.body)
        response = client.table('NGUOI_DUNG').insert(data).execute()
        return JsonResponse({'status': 'success', 'data': response.data}, status=201)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
