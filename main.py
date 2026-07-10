import discord
from discord.ext import commands
from flask import Flask, Response, request
import random, string, json, threading, os, requests, datetime

TOKEN = os.getenv('TOKEN')
WEBHOOK_URL = os.getenv('WEBHOOK_URL') 
ARQUIVO_KEYS = 'keys.json'
LINK_MENU_OFCUSCADO = "https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/script.lua"

def ler_keys():
    if not os.path.exists(ARQUIVO_KEYS): return {}
    with open(ARQUIVO_KEYS, 'r') as f: return json.load(f)

def salvar_keys(keys):
    with open(ARQUIVO_KEYS, 'w') as f: json.dump(keys, f, indent=4)

# Envia log sem bibliotecas pesadas
def enviar_log_discord(user_id, key):
    avatar_url = f"https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={user_id}&size=420x420&format=Png"
    try:
        res = requests.get(avatar_url).json()
        foto = res['data'][0]['imageUrl']
    except:
        foto = ""
    
    data = {
        "embeds": [{
            "title": "✅ Novo Login Detectado",
            "color": 65280,
            "fields": [
                {"name": "User ID", "value": str(user_id), "inline": True},
                {"name": "Key", "value": f"`{key}`", "inline": True},
                {"name": "Horário", "value": str(datetime.datetime.now()), "inline": False}
            ],
            "thumbnail": {"url": foto}
        }]
    }
    requests.post(WEBHOOK_URL, json=data)

app = Flask(__name__)

@app.route('/verificar', methods=['GET'])
def verificar_key():
    key_enviada = request.args.get('key')
    user_id = request.args.get('uid')
    keys = ler_keys()
    if key_enviada in keys:
        if user_id:
            threading.Thread(target=enviar_log_discord, args=(user_id, key_enviada)).start()
        return requests.get(LINK_MENU_OFCUSCADO).text, 200, {'Content-Type': 'text/plain'}
    return "invalida", 403

def run_flask():
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

threading.Thread(target=run_flask).start()

bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())

@bot.command()
async def gerar(ctx):
    nova_key = "KEY-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    keys = ler_keys()
    keys[nova_key] = {"user": str(ctx.author)}
    salvar_keys(keys)
    await ctx.send(f"✅ Chave gerada: `{nova_key}`")

@bot.command()
async def testar(ctx):
    threading.Thread(target=enviar_log_discord, args=("1", "TESTE-KEY")).start()
    await ctx.send("✅ Teste enviado.")

bot.run(TOKEN)
