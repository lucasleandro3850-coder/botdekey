const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const app = express();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const GIST_ID = 'SEU_GIST_ID_AQUI'; 
const GITHUB_TOKEN = 'SEU_TOKEN_DO_GITHUB_AQUI';

// API de Validação (Roblox acessa isso)
app.get('/verificar', async (req, res) => {
    const key = req.query.key;
    const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`);
    const keys = JSON.parse(response.data.files['keys.json'].content);
    res.send(keys.includes(key) ? 'OK' : 'INVALID');
});

// Bot do Discord
client.on('messageCreate', async (msg) => {
    if (msg.content.startsWith('/gerar')) {
        const novaKey = Math.random().toString(36).substring(7); // Gera Key
        // Lógica para dar PATCH no GitHub e adicionar a novaKey...
        msg.reply('Key gerada: ' + novaKey);
    }
});

client.login('SEU_TOKEN_DO_BOT_DISCORD');
app.listen(3000);
