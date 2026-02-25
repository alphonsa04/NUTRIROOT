import os
import ssl
import time
import json
import paho.mqtt.client as mqtt

# HiveMQ Cloud Configuration
MQTT_HOST = "643320592eb541029f015aa6bcde7f96.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "alphonsa"
MQTT_PASSWORD = "w9njxV#0"
MQTT_TOPIC = "nutriroot/soil_data"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully to HiveMQ Cloud!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received data on {msg.topic}: {payload}")
        # Logic to save to Firestore can be added here
    except Exception as e:
        print(f"Error parsing message: {e}")

# Initialize Client
client = mqtt.Client(client_id="NutriRoot_Bridge", clean_session=True)
client.on_connect = on_connect
client.on_message = on_message

# Security: Enable TLS for HiveMQ Cloud
client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

if __name__ == "__main__":
    print(f"Starting NutriRoot MQTT Bridge...")
    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        client.loop_forever()
    except KeyboardInterrupt:
        print("Stopping bridge...")
        client.disconnect()
    except Exception as e:
        print(f"Failed to connect: {e}")
