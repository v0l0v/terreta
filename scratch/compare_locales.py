import json

def get_keys(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
    return set(data.keys())

en_keys = get_keys('src/locales/en.json')
es_keys = get_keys('src/locales/es.json')

en_not_es = en_keys - es_keys
es_not_en = es_keys - en_keys

print(f"Keys in EN but not ES: {len(en_not_es)}")
for k in sorted(en_not_es):
    print(f"  - {k}")

print(f"Keys in ES but not EN: {len(es_not_en)}")
for k in sorted(es_not_en):
    print(f"  - {k}")
