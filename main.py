from flask import Flask, request
import json, os, requests, time

app = Flask(__name__)
# O Render atualiza os arquivos do GitHub a cada commit
def ler_keys():
    try:
        with open('keys.json', 'r') as f: return json.load(f)
    except: return {}

@app.route('/verificar', methods=['GET'])
def verificar():
    key = request.args.get('key')
    keys = ler_keys()
    if key in keys:
        dados = keys[key]
        # Se for perm ou 24h válida
        if dados['tipo'] == 'perm' or (time.time() - dados['criado'] < 86400):
            return requests.get("LINK_DO_SEU_GIST_OFUSCADO").text, 200, {'Content-Type': 'text/plain'}
    return "invalida", 403

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
