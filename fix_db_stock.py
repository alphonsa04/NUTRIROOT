import urllib.request
import json

API_KEY = "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I"
PROJECT_ID = "nutriroot-9dcdc"

def patch_product(doc_id, field_updates):
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/products/{doc_id}?updateMask.fieldPaths=status&updateMask.fieldPaths=stock&updateMask.fieldPaths=stock_quantity&key={API_KEY}"
    
    # Construct fields correctly for Firestore REST API
    fields = {}
    for k, v in field_updates.items():
        if isinstance(v, str):
            fields[k] = {"stringValue": v}
        else:
            fields[k] = {"integerValue": str(v)}
            
    payload = json.dumps({"fields": fields}).encode()
    req = urllib.request.Request(url, data=payload, method='PATCH')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Updated {doc_id}: {response.getcode()}")
    except Exception as e:
        print(f"Failed to update {doc_id}: {e}")

if __name__ == "__main__":
    # 1. Neutralize the system default Neem Cake (ID: neem_cake) which has 400 stock
    patch_product("neem_cake", {"status": "pending"})
    
    # 2. Ensure the seller's Neem Cake also has a matching stock_quantity field just in case
    # ID was 2iSPdOVZDTMHbu6ZuGAYjgYYaSq1_neem_cake
    patch_product("2iSPdOVZDTMHbu6ZuGAYjgYYaSq1_neem_cake", {"stock_quantity": 4, "stock": 4})
