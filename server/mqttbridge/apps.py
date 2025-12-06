import os
import sys
from django.apps import AppConfig

class MqttBridgeConfig(AppConfig):
    name = 'mqttbridge'

    def ready(self):
        # Prevent starting in reloader thread or during migrations
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return
            
        # Avoid starting during migrations or other management commands if desired
        # But for simplicity and robustness in Render (gunicorn), we just want to ensure it runs.
        # In Gunicorn, ready() is called for each worker.
        # If we have multiple workers, we might have multiple MQTT clients.
        # For this task, we assume 1 worker or that multiple clients are acceptable (they will just publish more data).
        
        from .mqtt_client import MQTTBridge
        
        # Simple singleton-ish check or just start it.
        # Since we want it to run in the background of the web process:
        try:
            bridge = MQTTBridge()
            bridge.start()
        except Exception as e:
            print(f"Error starting MQTT Bridge: {e}")
