import discord
from discord.ext import commands
from flask import Flask, request, jsonify
import random, string, json, threading, os

# --- CONFIGURAÇÃO ---
TOKEN = os.getenv('TOKEN')
ARQUIVO_KEYS = 'keys.json'

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
        return jsonify({"status": "sucesso"}), 200
    return jsonify({"status": "erro"}), 403

def run_flask():
    # O Render escolhe a porta automaticamente, isso evita que o site dê erro
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
    await ctx.send(f"✅ Chave: `{nova_key}`")

if __name__ == '__main__':
    threading.Thread(target=run_flask).start()
    bot.run(TOKEN)
