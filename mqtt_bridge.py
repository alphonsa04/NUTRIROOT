import ssl
import time
import json
import threading
import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import firebase_admin
from firebase_admin import credentials, firestore

# HiveMQ Cloud Configuration
MQTT_HOST = "643320592eb541029f015aa6bcde7f96.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "alphonsa"
MQTT_PASSWORD = "w9njxV#0"
MQTT_TOPIC = "nutriroot/#"

# Global state to store latest sensor data
latest_sensor_data = {
    "moisture": 0,
    "temperature": 0,
    "nitrogen": 0,
    "phosphorus": 0,
    "potassium": 0,
    "ph": 7.0,
    "last_update": None
}

# Optional: Firebase Initialization (Uncomment once you have serviceAccountKey.json)
# cred = credentials.Certificate("serviceAccountKey.json")
# firebase_admin.initialize_app(cred)
# db = firestore.client()

def sync_to_firestore(data):
    """Sync latest sensor data to Firestore for remote mobile access"""
    # try:
    #     db.collection('sensorData').document('latest').set(data)
    #     print("Synced to Firestore successfully!")
    # except Exception as e:
    #     print(f"Firestore Sync Error: {e}")
    pass

# FastAPI Setup
app = FastAPI()

# Enable CORS so the local website can fetch data
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/sensors")
async def get_sensors():
    return latest_sensor_data

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully to HiveMQ Cloud!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Connection failed with code {rc}")

def on_message(client, userdata, msg):
    global latest_sensor_data
    try:
        payload_str = msg.payload.decode()
        print(f"Received data on {msg.topic}: {payload_str}")
        
        # 1. Handle the structured JSON data topic: nutriroot/data
        if msg.topic == "nutriroot/data":
            payload = json.loads(payload_str)
            # Map ESP32 field names to bridge field names
            if "temp" in payload:
                latest_sensor_data["temperature"] = payload["temp"]
            if "soil_percent" in payload:
                latest_sensor_data["moisture"] = payload["soil_percent"]
            
        # 2. Handle individual fallback topics
        elif msg.topic == "nutriroot/temperature":
            try:
                latest_sensor_data["temperature"] = float(payload_str)
            except: pass
        elif msg.topic == "nutriroot/soil_percent":
            try:
                latest_sensor_data["moisture"] = float(payload_str)
            except: pass
            
        latest_sensor_data["last_update"] = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"Local state updated: Temp: {latest_sensor_data['temperature']}C, Moisture: {latest_sensor_data['moisture']}%")
        sync_to_firestore(latest_sensor_data)
        
    except Exception as e:
        print(f"Error parsing message: {e}")

# Initialize MQTT Client
mqtt_client = mqtt.Client(client_id="NutriRoot_Local_Bridge", clean_session=True)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

def run_mqtt():
    print("Starting MQTT Thread...")
    try:
        mqtt_client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        mqtt_client.loop_forever()
    except Exception as e:
        print(f"MQTT Error: {e}")

if __name__ == "__main__":
    # 1. Start MQTT Listener in a background thread
    mqtt_thread = threading.Thread(target=run_mqtt, daemon=True)
    mqtt_thread.start()
    
    # 2. [DISABLED] Mock Sensor Publisher - Real ESP32 hardware is now used
    # Uncomment the lines below ONLY if you want to test with simulated data
    # from mock_sensors import start_mocking
    # mock_thread = threading.Thread(target=start_mocking, daemon=True)
    # mock_thread.start()
    # print("Mock Sensor Simulation Started (Publishing to cloud)...")
    print("Listening for REAL sensor data from ESP32 via HiveMQ...")
    
    # 3. Start FastAPI server
    print("Starting Local API Bridge at http://localhost:8000")
    print("The Dashboard will fetch data from http://localhost:8000/sensors")
    uvicorn.run(app, host="0.0.0.0", port=8000)
