import os
import json
import time
from flask import Flask, request
import requests

# Inicializa o Flask
app = Flask(__name__)

# Rota de verificação (o menu vai bater aqui)
@app.route('/verificar', methods=['GET'])
def verificar():
    key = request.args.get('key')
    # Carrega suas keys (coloque o caminho correto do seu arquivo)
    try:
        with open('keys.json', 'r') as f:
            keys = json.load(f)
    except:
        keys = {}

    if key in keys:
        # Se for válida, entrega o script
        return requests.get("https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/script.lua").text, 200, {'Content-Type': 'text/plain'}
    
    return "invalida", 403

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
