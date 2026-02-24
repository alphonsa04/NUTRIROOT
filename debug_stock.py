import urllib.request
import json

API_KEY = "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I"
PROJECT_ID = "nutriroot-9dcdc"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/products"

def check_neem_cake():
    url = f"{BASE_URL}?key={API_KEY}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            docs = data.get('documents', [])
            print("--- Detailed Product Diagnostic ---")
            for d in docs:
                f = d.get('fields', {})
                name = f.get('name', {}).get('stringValue', '')
                if 'Neem' in name:
                    print(f"Product: {name} (ID: {d['name'].split('/')[-1]})")
                    for field_name, value in f.items():
                        if 'stock' in field_name.lower() or 'qty' in field_name.lower() or field_name == 'price':
                            print(f"  {field_name}: {value}")
            print("-------------------------------")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_neem_cake()
