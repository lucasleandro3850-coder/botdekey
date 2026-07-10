from flask import Flask, request
import json, os, requests, time

app = Flask(__name__)
# O link do seu script ofuscado
LINK_MENU = "https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/script.lua"

def ler_keys():
    try:
        with open('keys.json', 'r') as f: return json.load(f)
    except: return {}

@app.route('/verificar', methods=['GET'])
def verificar():
    key = request.args.get('key')
    keys = ler_keys()
    if key in keys:
        # Entrega o script ofuscado
        return requests.get(LINK_MENU).text, 200, {'Content-Type': 'text/plain'}
    return "invalida", 403

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
