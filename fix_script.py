
file_path = r"c:\Users\hp\OneDrive\Documents\PROJECT\CODE(Antigravity)\nutriroot\js\script.js"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Lines to remove: 764 to 1096 (1-based)
    # 0-based: 763 to 1095 (inclusive)
    # Slice: keep 0..763 and 1096..end
    
    start_idx = 763
    end_idx = 1096 # The index to start keeping again

    new_lines = lines[:start_idx] + lines[end_idx:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("Successfully removed broken lines.")

except Exception as e:
    print(f"Error: {e}")
