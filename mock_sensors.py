import firebase_admin
from firebase_admin import credentials, firestore
import time
import random

# Initialize Firebase (assuming project default or service account)
# For local testing, ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account JSON
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app()

db = firestore.client()

def mock_sensor_data(uid):
    print(f"Starting mock data for user: {uid}")
    sensor_ref = db.collection('users').doc(uid).collection('liveData').doc('sensors')
    
    try:
        while True:
            # Generate realistic agricultural ranges
            moisture = round(random.uniform(40.0, 75.0), 1)
            temp = round(random.uniform(22.0, 32.0), 1)
            
            data = {
                'moisture': moisture,
                'temperature': temp,
                'last_update': firestore.SERVER_TIMESTAMP
            }
            
            sensor_ref.set(data, merge=True)
            print(f"Sent -> Moisture: {moisture}%, Temp: {temp}°C")
            
            time.sleep(5)  # Update every 5 seconds
            
    except KeyboardInterrupt:
        print("Mocking stopped.")

if __name__ == "__main__":
    # In a real scenario, you'd get the actual user UID
    # For testing, we can use a known test UID or ask the user
    user_uid = "user123" # Default from script.js mock or user's actual UID
    mock_sensor_data(user_uid)
