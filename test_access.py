import os
path = os.path.abspath("NutriRoot.pptx")
print(f"Path: {path}")
print(f"Exists: {os.path.exists(path)}")
try:
    with open(path, "rb") as f:
        data = f.read(100)
    print(f"Read success, first 100 bytes: {data[:10]}...")
except Exception as e:
    print(f"Read failed: {e}")
