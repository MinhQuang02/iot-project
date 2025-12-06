import os
import json
import time
import random
import threading
import logging
import ssl
import paho.mqtt.client as mqtt
from datetime import datetime, timezone
from .lockstore import LastStore

logger = logging.getLogger(__name__)

class MQTTBridge:
    def __init__(self):
        self.host = os.environ.get('MQTT_HOST', '0f9083f82a914f0dadbb8e63ead02e07.s1.eu.hivemq.cloud')
        self.port = int(os.environ.get('MQTT_PORT', 8883))
        self.username = os.environ.get('MQTT_USERNAME', 'pqminh')
        self.password = os.environ.get('MQTT_PASSWORD', 'pKH478Dyjpc6fW@')
        self.publish_topic = 'theprophecy/sensors/mock/readings'
        self.subscribe_topic = 'theprophecy/commands/in'
        self.publish_interval = int(os.environ.get('PUBLISH_INTERVAL_SECONDS', 5))
        
        self.client = mqtt.Client()
        self.client.username_pw_set(self.username, self.password)
        self.client.tls_set(cert_reqs=ssl.CERT_NONE)
        self.client.tls_insecure_set(True)
        
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        
        self.running = False
        self.store = LastStore.get_instance()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to MQTT Broker!")
            client.subscribe(self.subscribe_topic)
        else:
            logger.error(f"Failed to connect, return code {rc}")

    def _on_message(self, client, userdata, msg):
        try:
            payload_str = msg.payload.decode()
            logger.info(f"Received message on {msg.topic}: {payload_str}")
            
            try:
                payload_data = json.loads(payload_str)
            except json.JSONDecodeError:
                payload_data = payload_str
                
            data = {
                "topic": msg.topic,
                "payload": payload_data,
                "received_at": datetime.now(timezone.utc).isoformat()
            }
            self.store.set('latest_subscribed', data)
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"Disconnected from MQTT Broker with code {rc}")
        if rc != 0:
            logger.info("Unexpected disconnection. Reconnecting...")

    def publish_mock_once(self):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "temperature": round(random.uniform(15.0, 35.0), 2),
            "humidity": round(random.uniform(20.0, 90.0), 2)
        }
        try:
            self.client.publish(self.publish_topic, json.dumps(payload))
            logger.info(f"Published to {self.publish_topic}: {payload}")
            
            data = {
                "topic": self.publish_topic,
                "payload": payload,
                "published_at": datetime.now(timezone.utc).isoformat()
            }
            self.store.set('latest_published', data)
        except Exception as e:
            logger.error(f"Failed to publish: {e}")

    def _loop_publisher(self):
        while self.running:
            self.publish_mock_once()
            time.sleep(self.publish_interval)

    def start(self):
        if self.running:
            return
        
        self.running = True
        try:
            self.client.connect(self.host, self.port, 60)
            self.client.loop_start()
            
            self.pub_thread = threading.Thread(target=self._loop_publisher, daemon=True)
            self.pub_thread.start()
            logger.info("MQTT Bridge started")
        except Exception as e:
            logger.error(f"Failed to start MQTT Bridge: {e}")
            self.running = False

    def stop(self):
        self.running = False
        self.client.loop_stop()
        self.client.disconnect()
