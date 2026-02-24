import urllib.request
import json

API_KEY = "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I"
PROJECT_ID = "nutriroot-9dcdc"
USERS_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/users?key={API_KEY}"

try:
    with urllib.request.urlopen(USERS_URL) as response:
        data = json.loads(response.read().decode())
        docs = data.get('documents', [])
        print(f"Total users: {len(docs)}")
        for d in docs:
            f = d.get('fields', {})
            role = f.get('role', {}).get('stringValue', 'farmer')
            email = f.get('email', {}).get('stringValue', 'No Email')
            name = f.get('name', {}).get('stringValue', 'No Name')
            print(f" - {name} ({email}) | Role: {role}")
except Exception as e:
    print(f"Error listing users: {e}")
