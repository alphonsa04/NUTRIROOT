import ssl
import time
import json
import random
import paho.mqtt.client as mqtt

# HiveMQ Cloud Configuration (Same as bridge)
MQTT_HOST = "643320592eb541029f015aa6bcde7f96.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "alphonsa"
MQTT_PASSWORD = "w9njxV#0"
MQTT_TOPIC = "nutriroot/soil_data"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Mock Sensor connected to HiveMQ Cloud!")
    else:
        print(f"Connection failed with code {rc}")

# Initialize MQTT Client
client = mqtt.Client(client_id="NutriRoot_Mock_Sensor", clean_session=True)
client.on_connect = on_connect
client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

def start_mocking():
    print(f"Starting mock MQTT data publishing...")
    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        client.loop_start() # Start loop in background
        
        while True:
            # Generate realistic agricultural ranges
            moisture = round(random.uniform(40.0, 75.0), 1)
            temp = round(random.uniform(22.0, 32.0), 1)
            
            payload = {
                'moisture': moisture,
                'temperature': temp,
                'nitrogen': random.randint(30, 80),
                'phosphorus': random.randint(20, 60),
                'potassium': random.randint(25, 70),
                'ph': round(random.uniform(5.5, 7.5), 2)
            }
            
            client.publish(MQTT_TOPIC, json.dumps(payload))
            print(f"Published -> Moisture: {moisture}%, Temp: {temp}°C")
            
            time.sleep(5)  # Update every 5 seconds
            
    except KeyboardInterrupt:
        print("Mocking stopped.")
        client.disconnect()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    start_mocking()
