import discord
from discord.ext import commands
from flask import Flask, Response, request
import random, string, json, threading, os, requests, datetime
from discord_webhook import DiscordWebhook, DiscordEmbed

# --- CONFIGURAÇÃO ---
TOKEN = os.getenv('TOKEN')
WEBHOOK_URL = "SUA_NOVA_WEBHOOK_AQUI" 
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
        
        # Tenta pegar a foto de perfil
        res_avatar = requests.get(avatar_url).json()
        foto_perfil = res_avatar['data'][0]['imageUrl'] if 'data' in res_avatar and len(res_avatar['data']) > 0 else ""
        
        embed = DiscordEmbed(title="✅ Novo Login Detectado", color='00ff00')
        embed.set_author(name=f"Roblox User ID: {user_id}")
        embed.add_embed_field(name="Key utilizada:", value=f"`{key}`", inline=False)
        embed.add_embed_field(name="Horário:", value=str(datetime.datetime.now()), inline=False)
        if foto_perfil:
            embed.set_thumbnail(url=foto_perfil)
        
        webhook.add_embed(embed)
        webhook.execute()
    except Exception as e:
        print(f"Erro ao enviar log: {e}")

# --- WEB SERVER ---
app = Flask(__name__)

@app.route('/')
def home(): return "Servidor Online!"

@app.route('/verificar', methods=['GET'])
def verificar_key():
    key_enviada = request.args.get('key')
    user_id = request.args.get('uid')
    keys = ler_keys()
    
    if key_enviada in keys:
        if user_id:
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

@bot.command()
async def testar(ctx):
    try:
        enviar_log_discord("1", "TESTE-KEY")
        await ctx.send("✅ Webhook funcionando! Verifique o canal #clientes.")
    except Exception as e:
        await ctx.send(f"❌ Erro no Webhook: {e}")

if __name__ == '__main__':
    threading.Thread(target=run_flask).start()
    bot.run(TOKEN)
