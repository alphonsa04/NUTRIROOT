import urllib.request
import json

API_KEY = "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I"
PROJECT_ID = "nutriroot-9dcdc"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/products"

def approve_product(doc_name):
    url = f"https://firestore.googleapis.com/v1/{doc_name}?updateMask.fieldPaths=status&key={API_KEY}"
    payload = {
        "fields": {
            "status": {"stringValue": "approved"}
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                print(f"Successfully approved {doc_name.split('/')[-1]}")
            else:
                print(f"Failed to approve {doc_name.split('/')[-1]}: Status {response.getcode()}")
    except Exception as e:
        print(f"Error approving {doc_name.split('/')[-1]}: {e}")

if __name__ == "__main__":
    url = f"{BASE_URL}?key={API_KEY}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            docs = data.get('documents', [])
            count = 0
            for d in docs:
                f = d.get('fields', {})
                s_name = f.get('sellerName', {}).get('stringValue', '')
                p_status = f.get('status', {}).get('stringValue', 'pending')
                
                if 'Jewel' in s_name and p_status != 'approved':
                    print(f"Approving: {f.get('name', {}).get('stringValue', 'N/A')} (Current Status: {p_status})")
                    approve_product(d['name'])
                    count += 1
            print(f"Finished. Total approved in this run: {count}")
    except Exception as e:
        print(f"Error: {e}")
