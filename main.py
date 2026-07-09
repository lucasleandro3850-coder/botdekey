import discord
from discord.ext import commands
from flask import Flask, Response
import random, string, json, threading, os, requests

# --- CONFIGURAÇÃO ---
TOKEN = os.getenv('TOKEN')
ARQUIVO_KEYS = 'keys.json'
# Link RAW do seu script ofuscado (o link "limpo" que testamos)
LINK_MENU_OFCUSCADO = "https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/script.lua"

def ler_keys():
    if not os.path.exists(ARQUIVO_KEYS): return {}
    with open(ARQUIVO_KEYS, 'r') as f: return json.load(f)

def salvar_keys(keys):
    with open(ARQUIVO_KEYS, 'w') as f: json.dump(keys, f, indent=4)

# --- WEB SERVER ---
app = Flask(__name__)

@app.route('/')
def home(): return "Servidor Online!"

@app.route('/verificar', methods=['GET'])
def verificar_key():
    key_enviada = request.args.get('key')
    keys = ler_keys()
    
    if key_enviada in keys:
        # Se a key é válida, baixa o script ofuscado e entrega como texto puro
        try:
            resposta = requests.get(LINK_MENU_OFCUSCADO)
            if resposta.status_code == 200:
                return resposta.text, 200, {'Content-Type': 'text/plain'}
            else:
                return "Erro ao baixar menu", 500
        except Exception as e:
            return "Erro interno", 500
    
    # Se a key não existir
    return "invalida", 403

def run_flask():
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

# --- BOT DISCORD ---
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.command()
async def gerar(ctx):
    nova_key = "KEY-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    keys = ler_keys()
    keys[nova_key] = {"user": str(ctx.author)}
    salvar_keys(keys)
    await ctx.send(f"✅ Chave gerada: `{nova_key}`")

if __name__ == '__main__':
    threading.Thread(target=run_flask).start()
    bot.run(TOKEN)
