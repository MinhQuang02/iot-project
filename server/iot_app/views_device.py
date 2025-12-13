
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from . import mqtt_service

class DeviceDoorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Control the door servo.
        Body: { "status": "open" | "close" }
        """
        status_val = request.data.get("status")
        if not status_val:
            return Response({"error": "Missing 'status' field"}, status=status.HTTP_400_BAD_REQUEST)
        
        success, msg = mqtt_service.control_servo(status_val)
        if success:
            return Response({"message": msg}, status=status.HTTP_200_OK)
        else:
            return Response({"error": msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeviceLCDView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Send text to LCD.
        Body: { "text": "Hello World" }
        """
        text = request.data.get("text")
        if not text:
            return Response({"error": "Missing 'text' field"}, status=status.HTTP_400_BAD_REQUEST)
        
        success, msg = mqtt_service.send_lcd_message(text)
        if success:
            return Response({"message": msg}, status=status.HTTP_200_OK)
        else:
            return Response({"error": msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeviceSensorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache = mqtt_service.get_cached_data()
        return Response({
            "temperature": cache["temperature"],
            "humidity": cache["humidity"],
            "last_update": cache["last_sensor_update"]
        }, status=status.HTTP_200_OK)


class DeviceCameraView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache = mqtt_service.get_cached_data()
        img = cache["camera_image"]
        if not img:
            return Response({"message": "No image available yet"}, status=status.HTTP_204_NO_CONTENT)
        # Return as JSON containing base64
        return Response({"image_base64": img}, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Trigger the camera to take a new photo.
        """
        success, msg = mqtt_service.request_camera_capture()
        if success:
            return Response({"message": msg}, status=status.HTTP_200_OK)
        else:
            return Response({"error": msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeviceRFIDView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache = mqtt_service.get_cached_data()
        rfid_data = cache["rfid_last_scan"]
        if not rfid_data:
            return Response({"message": "No scan data available"}, status=status.HTTP_204_NO_CONTENT)
        return Response(rfid_data, status=status.HTTP_200_OK)
