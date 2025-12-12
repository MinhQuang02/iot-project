from django.apps import AppConfig


class IotAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'iot_app'

    def ready(self):
        import os
        import sys
        
        # Avoid running twice due to reloader or other management commands
        # A simple heuristic: usually runserver is in argv.
        # But autoreload spawns a child process. We want it in the child process (the actual server).
        # Standard approach: check if RUN_MAIN is 'true' (set by django reloader).
        
        if os.environ.get('RUN_MAIN') == 'true':
            try:
                from .mqtt_service import start_mqtt_daemon
                start_mqtt_daemon()
                print("[IotApp] MQTT Daemon Started.")
            except ImportError:
                pass
        else:
             # If --noreload is used, RUN_MAIN might not be set, so fall back or just ignore for dev.
             # For simpler dev setup, we can try to start it if 'runserver' is in argv.
             if 'runserver' in sys.argv:
                 # This path catches the outer process or --noreload
                 # If using default autoreload, this runs once for the outer process (which just watches files)
                 # We DON'T want to connect there usually.
                 pass
