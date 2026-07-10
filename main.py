import discord
from discord.ext import commands
from flask import Flask, Response, request
import random, string, json, threading, os, requests, datetime
from discord_webhook import DiscordWebhook, DiscordEmbed

TOKEN = os.getenv('TOKEN')
WEBHOOK_URL = "https://discord.com/api/webhooks/1524929913726173236/WGGxxNgz3iozyvJ3LL-5QdFUUUXa-JYWx_Sadb5IB4mgObY8DW64fERWhGK3lJKkqVpj" # Substitua pelo novo webhook!
ARQUIVO_KEYS = 'keys.json'
LINK_MENU_OFCUSCADO = "https://gist.githubusercontent.com/lucasleandro3850-coder/afe334f158cdd53301d8b642bafa855d/raw/script.lua"

def ler_keys():
    if not os.path.exists(ARQUIVO_KEYS): return {}
    with open(ARQUIVO_KEYS, 'r') as f: return json.load(f)

def salvar_keys(keys):
    with open(ARQUIVO_KEYS, 'w') as f: json.dump(keys, f, indent=4)

def enviar_log_discord(user_id, key):
    try:
        webhook = DiscordWebhook(url=WEBHOOK_URL)
        avatar_url = f"https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={user_id}&size=420x420&format=Png"
        foto_perfil = requests.get(avatar_url).json()['data'][0]['imageUrl']
        
        embed = DiscordEmbed(title="✅ Novo Login Detectado", color='00ff00')
        embed.set_author(name=f"Roblox User ID: {user_id}")
        embed.add_embed_field(name="Key utilizada:", value=f"`{key}`", inline=False)
        embed.add_embed_field(name="Horário:", value=str(datetime.datetime.now()), inline=False)
        embed.set_thumbnail(url=foto_perfil)
        
        webhook.add_embed(embed)
        webhook.execute()
    except Exception as e:
        print(f"Erro ao enviar log: {e}")

app = Flask(__name__)

@app.route('/verificar', methods=['GET'])
def verificar_key():
    key_enviada = request.args.get('key')
    user_id = request.args.get('uid')
    keys = ler_keys()
    
    if key_enviada in keys:
        threading.Thread(target=enviar_log_discord, args=(user_id, key_enviada)).start()
        try:
            resposta = requests.get(LINK_MENU_OFCUSCADO)
            return resposta.text, 200, {'Content-Type': 'text/plain'}
        except:
            return "Erro ao baixar menu", 500
    return "invalida", 403

def run_flask():
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

# --- BOT ---
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
