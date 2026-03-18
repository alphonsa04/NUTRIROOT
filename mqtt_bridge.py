import ssl
import time
import json
import threading
import os
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

# Load environment variables from .env (for local testing)
load_dotenv()

# HiveMQ Cloud Configuration (using environment variables)
MQTT_HOST = os.getenv("MQTT_HOST", "643320592eb541029f015aa6bcde7f96.s1.eu.hivemq.cloud")
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_USER = os.getenv("MQTT_USER", "alphonsa")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "w9njxV#0")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "nutriroot/#")

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

# FastAPI Setup
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoint
@app.get("/sensors")
async def get_sensors():
    return latest_sensor_data

# MQTT Handlers
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
        if msg.topic == "nutriroot/data":
            payload = json.loads(payload_str)
            if "temp" in payload:
                latest_sensor_data["temperature"] = payload["temp"]
            if "soil_percent" in payload:
                latest_sensor_data["moisture"] = payload["soil_percent"]
        elif msg.topic == "nutriroot/soil_data":
            payload = json.loads(payload_str)
            # Map all fields from mock_sensors.py
            field_map = {
                "moisture": "moisture",
                "temperature": "temperature",
                "nitrogen": "nitrogen",
                "phosphorus": "phosphorus",
                "potassium": "potassium",
                "ph": "ph"
            }
            for key, target in field_map.items():
                if key in payload:
                    latest_sensor_data[target] = payload[key]
        elif msg.topic == "nutriroot/temperature":
            try: latest_sensor_data["temperature"] = float(payload_str)
            except: pass
        elif msg.topic == "nutriroot/soil_percent":
            try: latest_sensor_data["moisture"] = float(payload_str)
            except: pass
            
        latest_sensor_data["last_update"] = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"Update: {latest_sensor_data}")
    except Exception as e:
        print(f"Error parsing MQTT message: {e}")

# Initialize MQTT Client
mqtt_client = mqtt.Client(client_id="NutriRoot_Railway_Bridge", clean_session=True)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

def run_mqtt():
    try:
        mqtt_client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        mqtt_client.loop_forever()
    except Exception as e:
        print(f"MQTT Error: {e}")

# Serve Static Files
# Mount CSS, JS, and Assets directories
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Route for index.html
@app.get("/")
async def read_index():
    return FileResponse("index.html")

# Route for other HTML pages (simplified)
@app.get("/{page}.html")
async def read_page(page: str):
    file_path = f"{page}.html"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Page not found"}

if __name__ == "__main__":
    mqtt_thread = threading.Thread(target=run_mqtt, daemon=True)
    mqtt_thread.start()
    print("Railway Bridge Ready...")
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
