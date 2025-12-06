from django.http import JsonResponse
from .lockstore import LastStore

def get_latest_subscribed(request):
    store = LastStore.get_instance()
    data = store.get('latest_subscribed')
    if data:
        return JsonResponse(data)
    return JsonResponse({"error": "No message received yet"}, status=404)

def get_latest_published(request):
    store = LastStore.get_instance()
    data = store.get('latest_published')
    if data:
        return JsonResponse(data)
    return JsonResponse({"error": "No message published yet"}, status=404)
