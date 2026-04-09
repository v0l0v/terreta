import json
import os

locales_dir = 'src/locales'
files = ['de.json', 'en.json', 'es.json', 'ja.json', 'th.json', 'val.json']

def clean_file(filename):
    path = os.path.join(locales_dir, filename)
    if not os.path.exists(path):
        return
    
    with open(path, 'r') as f:
        lines = f.readlines()
    
    seen_keys = set()
    new_lines = []
    
    # We want to keep the LAST occurrence of each key (standard JSON behavior)
    # So we iterate backwards
    for line in reversed(lines):
        if '": "' in line:
            key = line.split('": "')[0].strip().strip('"')
            if key in seen_keys:
                print(f"Removing duplicate key '{key}' from {filename}")
                continue
            seen_keys.add(key)
        new_lines.append(line)
    
    # Sort keys if necessary? No, better keep original order as much as possible
    # Wait, if I iterate backwards, I reversed the file. Reverse it back.
    new_lines.reverse()
    
    with open(path, 'w') as f:
        f.writelines(new_lines)

for f in files:
    clean_file(f)
