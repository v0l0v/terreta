import json

def load_json(filename):
    with open(filename, 'r') as f:
        return json.load(f)

en = load_json('src/locales/en.json')
es = load_json('src/locales/es.json')

untranslated = []
for key in en:
    if key in es and en[key] == es[key] and len(en[key]) > 0:
        # Check if it's a technical term/name that shouldn't be translated
        if key.startswith('common.') or 'appName' in key or 'url' in key or 'npub' in key:
            continue
        untranslated.append(key)

print(f"Potential untranslated keys in ES: {len(untranslated)}")
for k in untranslated:
    print(f"  - {k}: \"{en[k]}\"")
