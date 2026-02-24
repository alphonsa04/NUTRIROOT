import requests
import json

API_KEY = "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I"
PROJECT_ID = "nutriroot-9dcdc"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/products"

def get_jewel_products():
    url = f"{BASE_URL}?key={API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching products: {response.text}")
        return []
    
    products = response.json().get('documents', [])
    jewel_products = []
    for p in products:
        fields = p.get('fields', {})
        seller_name = fields.get('sellerName', {}).get('stringValue', '')
        status = fields.get('status', {}).get('stringValue', '')
        if 'Jewel Treasa' in seller_name and status == 'pending':
            jewel_products.append(p)
    return jewel_products

def approve_product(doc_name):
    url = f"https://firestore.googleapis.com/v1/{doc_name}?updateMask.fieldPaths=status&key={API_KEY}"
    payload = {
        "fields": {
            "status": {"stringValue": "approved"}
        }
    }
    response = requests.patch(url, json=payload)
    if response.status_code == 200:
        print(f"Successfully approved {doc_name.split('/')[-1]}")
    else:
        print(f"Failed to approve {doc_name.split('/')[-1]}: {response.text}")

if __name__ == "__main__":
    products = get_jewel_products()
    if not products:
        print("No pending products found for Jewel Treasa.")
    else:
        print(f"Found {len(products)} pending products for Jewel Treasa.")
        for p in products:
            approve_product(p['name'])
