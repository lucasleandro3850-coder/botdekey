import discord
from discord.ext import commands
from flask import Flask, request
import threading, os, requests, time, json

app = Flask(__name__)
TOKEN = os.getenv('TOKEN')

@app.route('/')
def home():
    return "Nipocos API Online"

# Rota simples de verificação (o menu lê daqui)
@app.route('/verificar', methods=['GET'])
def verificar():
    key = request.args.get('key')
    # Carrega as keys do arquivo local
    try:
        with open('keys.json', 'r') as f: keys = json.load(f)
        if key in keys:
            # Aqui você entrega o seu script ofuscado
            return "CODIGO_OFUSCADO_AQUI", 200
    except: pass
    return "invalida", 403

def run_flask():
    app.run(host='0.0.0.0', port=5000)

# Inicia o Flask
threading.Thread(target=run_flask).start()

# Inicia o Bot
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'Bot logado como {bot.user}')

@bot.command()
async def gerar(ctx):
    await ctx.send("Comando de gerar key...")

bot.run(TOKEN)
