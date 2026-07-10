from flask import Flask, request
import json, os, requests, time

app = Flask(__name__)

# Link direto
LINK_MENU = "https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/script.lua"

@app.route('/verificar', methods=['GET'])
def verificar():
    key = request.args.get('key')
    if not os.path.exists('keys.json'): return "invalida", 403
    with open('keys.json', 'r') as f: keys = json.load(f)
    
    if key in keys:
        try:
            resp = requests.get(LINK_MENU)
            return resp.text, 200, {'Content-Type': 'text/plain'}
        except: return "Erro no script", 500
    return "invalida", 403

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
